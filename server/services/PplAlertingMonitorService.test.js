/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import PplAlertingMonitorService from './PplAlertingMonitorService';

const buildService = (clientImpl) => {
  const service = new PplAlertingMonitorService(
    /* osDriver */ { asScoped: jest.fn() },
    /* dataSourceEnabled */ false,
    /* logger */ { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
  );
  // Stub the base-class collaborators so the handler logic runs in isolation.
  service.enforceWorkspaceAcl = jest.fn().mockResolvedValue(null);
  service.getClientBasedOnDataSource = jest.fn().mockResolvedValue(clientImpl);
  service.enrichTargetArn = jest.fn(async (_context, _req, body) => body);
  return service;
};

const buildRes = () => ({
  ok: jest.fn((payload) => payload),
});

const PPL_MONITOR_BODY = {
  ppl_monitor: {
    name: 'my monitor',
    enabled: true,
    schedule: { period: { interval: 1, unit: 'MINUTES' } },
    query: "source = logs-* | where body like '%ERROR%'",
    triggers: [
      {
        name: 't1',
        severity: 'info',
        type: 'number_of_results',
        num_results_condition: '>',
        num_results_value: 1,
        actions: [],
        custom_condition: null,
      },
    ],
  },
};

describe('PplAlertingMonitorService.updateMonitor query guard', () => {
  test('rejects an update whose body is missing the PPL query', async () => {
    const client = jest.fn();
    const service = buildService(client);
    const res = buildRes();
    const bodyWithoutQuery = {
      ppl_monitor: { ...PPL_MONITOR_BODY.ppl_monitor, query: undefined },
    };

    const result = await service.updateMonitor(
      {},
      { params: { id: 'mon-1' }, query: {}, body: bodyWithoutQuery },
      res
    );

    expect(client).not.toHaveBeenCalled();
    expect(result.body.ok).toBe(false);
    expect(result.body.resp).toContain('missing the PPL query');
  });

  test('rejects an update whose query is only whitespace', async () => {
    const client = jest.fn();
    const service = buildService(client);
    const res = buildRes();
    const bodyBlankQuery = {
      ppl_monitor: { ...PPL_MONITOR_BODY.ppl_monitor, query: '   ' },
    };

    const result = await service.updateMonitor(
      {},
      { params: { id: 'mon-1' }, query: {}, body: bodyBlankQuery },
      res
    );

    expect(client).not.toHaveBeenCalled();
    expect(result.body.ok).toBe(false);
  });

  test('forwards a valid update translated to the engine format', async () => {
    const client = jest.fn().mockResolvedValue({ _id: 'mon-1' });
    const service = buildService(client);
    const res = buildRes();

    const result = await service.updateMonitor(
      {},
      { params: { id: 'mon-1' }, query: {}, body: PPL_MONITOR_BODY },
      res
    );

    expect(result.body.ok).toBe(true);
    expect(client).toHaveBeenCalledTimes(1);
    const [, callArgs] = client.mock.calls[0];
    expect(callArgs.method).toBe('PUT');
    expect(callArgs.path).toContain('/_plugins/_alerting/monitors/mon-1');
    // engine shape: top-level name, ppl_input inputs, ppl_trigger-wrapped triggers
    expect(callArgs.body.name).toBe('my monitor');
    expect(callArgs.body.monitor_type).toBe('ppl_monitor');
    expect(callArgs.body.inputs[0].ppl_input.query).toContain('source = logs-*');
    expect(callArgs.body.triggers[0].ppl_trigger).toBeDefined();
  });

  test('accepts a raw engine-shape body whose query is nested in inputs[0].ppl_input (details-page enable/disable round-trip)', async () => {
    const client = jest.fn().mockResolvedValue({ _id: 'mon-1' });
    const service = buildService(client);
    const res = buildRes();
    // Shape sent by the monitor details page enable/disable toggle: the raw
    // engine-format monitor round-tripped verbatim -- query nested, nothing at top level.
    const engineShapeBody = {
      ppl_monitor: {
        type: 'monitor',
        schema_version: 8,
        name: 'ppl-monitor-test',
        enabled: false,
        schedule: { period: { interval: 1, unit: 'MINUTES' } },
        inputs: [
          {
            ppl_input: {
              query: "source = logs-otel* | where severityText = 'ERROR'",
              query_language: 'ppl',
            },
          },
        ],
        triggers: [
          {
            ppl_trigger: {
              id: 'trigger-id-1',
              name: 'results-trigger',
              severity: '1',
              actions: [],
              type: 'number_of_results',
              num_results_condition: '>',
              num_results_value: 0,
            },
          },
        ],
      },
    };

    const result = await service.updateMonitor(
      {},
      { params: { id: 'mon-1' }, query: {}, body: engineShapeBody },
      res
    );

    // The guard must not reject it, and the query must survive the translation
    // instead of being wiped to ''.
    expect(result.body.ok).toBe(true);
    expect(client).toHaveBeenCalledTimes(1);
    const [, callArgs] = client.mock.calls[0];
    expect(callArgs.body.inputs[0].ppl_input.query).toBe(
      "source = logs-otel* | where severityText = 'ERROR'"
    );
    expect(callArgs.body.enabled).toBe(false);
    expect(callArgs.body.triggers[0].ppl_trigger).toBeDefined();
    // Stale trigger metadata must be stripped from the wrapped shape too,
    // matching what the flattened path does for unwrapped triggers.
    expect(callArgs.body.triggers[0].ppl_trigger.id).toBeUndefined();
    expect(callArgs.body.triggers[0].ppl_trigger.last_triggered_time).toBeUndefined();
    expect(callArgs.body.triggers[0].ppl_trigger.last_execution_time).toBeUndefined();
    expect(callArgs.body.triggers[0].ppl_trigger.name).toBe('results-trigger');
  });

  test('falls back to the nested query when the top-level query is whitespace-only', async () => {
    const client = jest.fn().mockResolvedValue({ _id: 'mon-1' });
    const service = buildService(client);
    const res = buildRes();
    const blankTopLevelBody = {
      ppl_monitor: {
        name: 'ppl-monitor-test',
        enabled: true,
        query: '   ',
        schedule: { period: { interval: 1, unit: 'MINUTES' } },
        inputs: [{ ppl_input: { query: 'source = logs | stats count()', query_language: 'ppl' } }],
        triggers: [],
      },
    };

    const result = await service.updateMonitor(
      {},
      { params: { id: 'mon-1' }, query: {}, body: blankTopLevelBody },
      res
    );

    // A blank top-level query must not short-circuit the nested fallback.
    expect(result.body.ok).toBe(true);
    expect(client).toHaveBeenCalledTimes(1);
    const [, callArgs] = client.mock.calls[0];
    expect(callArgs.body.inputs[0].ppl_input.query).toBe('source = logs | stats count()');
  });

  test('rejects an engine-shape body whose nested query is empty', async () => {
    const client = jest.fn();
    const service = buildService(client);
    const res = buildRes();
    const emptyNestedQueryBody = {
      ppl_monitor: {
        name: 'ppl-monitor-test',
        enabled: true,
        schedule: { period: { interval: 1, unit: 'MINUTES' } },
        inputs: [{ ppl_input: { query: '', query_language: 'ppl' } }],
        triggers: [],
      },
    };

    const result = await service.updateMonitor(
      {},
      { params: { id: 'mon-1' }, query: {}, body: emptyNestedQueryBody },
      res
    );

    expect(client).not.toHaveBeenCalled();
    expect(result.body.ok).toBe(false);
    expect(result.body.resp).toContain('missing the PPL query');
  });

  test('rejects an engine-shape body whose ppl_input is empty', async () => {
    const client = jest.fn();
    const service = buildService(client);
    const res = buildRes();
    const emptyInputBody = {
      ppl_monitor: {
        name: 'ppl-monitor-test',
        enabled: true,
        schedule: { period: { interval: 1, unit: 'MINUTES' } },
        inputs: [{ ppl_input: {} }],
        triggers: [],
      },
    };

    const result = await service.updateMonitor(
      {},
      { params: { id: 'mon-1' }, query: {}, body: emptyInputBody },
      res
    );

    expect(client).not.toHaveBeenCalled();
    expect(result.body.ok).toBe(false);
    expect(result.body.resp).toContain('missing the PPL query');
  });
});

describe('PplAlertingMonitorService.executeMonitor engine-format translation', () => {
  test('translates the flattened ppl_monitor body to the engine format before hitting the engine', async () => {
    const client = jest.fn().mockResolvedValue({ monitor_name: 'my monitor' });
    const service = buildService(client);
    const res = buildRes();

    const result = await service.executeMonitor(
      {},
      { query: {}, body: PPL_MONITOR_BODY },
      res
    );

    expect(result.body.ok).toBe(true);
    const [, callArgs] = client.mock.calls[0];
    expect(callArgs.method).toBe('POST');
    expect(callArgs.path).toContain('/_plugins/_alerting/monitors/_execute');
    // The engine's Monitor.parse requires a top-level name -- the untranslated
    // { ppl_monitor: {...} } wrapper used to fail with "Monitor name is null".
    expect(callArgs.body.name).toBe('my monitor');
    expect(callArgs.body.ppl_monitor).toBeUndefined();
    expect(callArgs.body.inputs[0].ppl_input.query).toContain('source = logs-*');
  });
});
