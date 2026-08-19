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

  test('forwards a valid update translated to the v1 engine format', async () => {
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
    // v1 shape: top-level name, ppl_input inputs, ppl_trigger-wrapped triggers
    expect(callArgs.body.name).toBe('my monitor');
    expect(callArgs.body.monitor_type).toBe('ppl_monitor');
    expect(callArgs.body.inputs[0].ppl_input.query).toContain('source = logs-*');
    expect(callArgs.body.triggers[0].ppl_trigger).toBeDefined();
  });
});

describe('PplAlertingMonitorService.executeMonitor v1 translation', () => {
  test('translates the v2 ppl_monitor body to v1 before hitting the engine', async () => {
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
