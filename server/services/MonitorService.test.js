/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import MonitorService, { buildNameSearchQuery } from './MonitorService';

const buildService = (clientImpl) => {
  const service = new MonitorService(
    /* osDriver */ { asScoped: jest.fn() },
    /* dataSourceEnabled */ false,
    /* logger */ { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
  );
  service.enforceWorkspaceAcl = jest.fn().mockResolvedValue(null);
  service.getClientBasedOnDataSource = jest.fn().mockResolvedValue(clientImpl);
  service.isUnsupportedEndpoint = jest.fn().mockResolvedValue(false);
  return service;
};

const buildRes = () => ({ ok: jest.fn((payload) => payload) });

const emptyListResponses = (client) => {
  // first call: job search, second call: alert aggregations
  client
    .mockResolvedValueOnce({ hits: { total: { value: 0 }, hits: [] }, aggregations: {} })
    .mockResolvedValueOnce({ aggregations: { uniq_monitor_ids: { buckets: [] } } });
};

describe('buildNameSearchQuery', () => {
  test('matches hyphenated names on the keyword sub-field, case-insensitively', () => {
    const query = buildNameSearchQuery('my-prod-monitor');

    expect(query.bool.minimum_should_match).toBe(1);
    const [monitorBranch, workflowBranch] = query.bool.should;
    expect(monitorBranch.bool.must).toEqual([
      {
        wildcard: {
          'monitor.name.keyword': { value: '*my-prod-monitor*', case_insensitive: true },
        },
      },
    ]);
    expect(workflowBranch.bool.must[0].wildcard['workflow.name.keyword'].value).toBe(
      '*my-prod-monitor*'
    );
  });

  test('requires every whitespace-separated term', () => {
    const query = buildNameSearchQuery('  long   monit ');
    const values = query.bool.should[0].bool.must.map(
      (clause) => clause.wildcard['monitor.name.keyword'].value
    );
    expect(values).toEqual(['*long*', '*monit*']);
  });

  test('escapes wildcard metacharacters typed by the user', () => {
    const query = buildNameSearchQuery('cpu*? \\x');
    const values = query.bool.should[0].bool.must.map(
      (clause) => clause.wildcard['monitor.name.keyword'].value
    );
    expect(values).toEqual(['*cpu\\*\\?*', '*\\\\x*']);
  });

  test('also matches on the analyzed name fields so names over ignore_above (256) are found', () => {
    const query = buildNameSearchQuery('  very long monitor name ');

    expect(query.bool.should).toHaveLength(4);
    expect(query.bool.should[2]).toEqual({
      match_phrase_prefix: { 'monitor.name': 'very long monitor name' },
    });
    expect(query.bool.should[3]).toEqual({
      match_phrase_prefix: { 'workflow.name': 'very long monitor name' },
    });
  });
});

describe('MonitorService.getMonitors', () => {
  const baseQuery = { from: 0, size: 20, sortDirection: 'asc', sortField: 'name', state: 'all' };

  test('uses match_all when the search box is empty', async () => {
    const client = jest.fn();
    emptyListResponses(client);
    const service = buildService(client);

    await service.getMonitors({}, { query: { ...baseQuery, search: '   ' } }, buildRes());

    const sent = client.mock.calls[0][1].body.query.bool.must;
    expect(sent).toEqual([{ match_all: {} }]);
  });

  test('sends a keyword wildcard over monitor and workflow names for a hyphenated search', async () => {
    const client = jest.fn();
    emptyListResponses(client);
    const service = buildService(client);

    await service.getMonitors(
      {},
      { query: { ...baseQuery, search: 'agentqa-run-s003' } },
      buildRes()
    );

    const sent = client.mock.calls[0][1].body.query.bool.must[0];
    expect(sent).toEqual(buildNameSearchQuery('agentqa-run-s003'));
    expect(JSON.stringify(sent)).not.toContain('query_string');
  });
});
