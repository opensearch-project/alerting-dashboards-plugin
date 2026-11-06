/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getInitialValues, getPlugins, reinitializeForDataSource } from './helpers';
import {
  MONITOR_TYPE,
  OS_AD_PLUGIN,
  OS_NOTIFICATION_PLUGIN,
  SEARCH_TYPE,
} from '../../../../../utils/constants';
import { setDataSource, setDataSourceEnabled } from '../../../../../services';

const pplMonitorToEdit = {
  name: 'ppl-monitor',
  monitor_type: MONITOR_TYPE.PPL,
  enabled: true,
  query: 'source = logs | stats count() by status',
  schedule: { period: { interval: 1, unit: 'MINUTES' } },
  triggers: [],
};

const queryLevelMonitorToEdit = {
  name: 'query-monitor',
  monitor_type: MONITOR_TYPE.QUERY_LEVEL,
  enabled: true,
  schedule: { period: { interval: 1, unit: 'MINUTES' } },
  inputs: [
    {
      search: {
        indices: ['logs'],
        query: { size: 0, query: { match_all: {} } },
      },
    },
  ],
  triggers: [],
  ui_metadata: {
    schedule: { frequency: 'interval', period: { interval: 1, unit: 'MINUTES' } },
    search: { searchType: SEARCH_TYPE.QUERY },
  },
};

describe('getInitialValues on edit', () => {
  test('preserves dataSourceId from the edit-page URL for PPL monitors', () => {
    const initialValues = getInitialValues({
      location: { search: '?action=edit-monitor&dataSourceId=my-data-source-id' },
      monitorToEdit: pplMonitorToEdit,
      edit: true,
    });

    // The hydrated monitor carries no dataSourceId, so it must be retained
    // from the URL for preview/field-detection calls to route correctly.
    expect(initialValues.dataSourceId).toBe('my-data-source-id');
    // Sanity: PPL hydration still populated the query.
    expect(initialValues.pplQuery).toBe(pplMonitorToEdit.query);
    expect(initialValues.monitor_type).toBe(MONITOR_TYPE.PPL);
  });

  test('preserves dataSourceId from the edit-page URL for non-PPL monitors', () => {
    const initialValues = getInitialValues({
      location: { search: '?action=edit-monitor&dataSourceId=my-data-source-id' },
      monitorToEdit: queryLevelMonitorToEdit,
      edit: true,
    });

    expect(initialValues.dataSourceId).toBe('my-data-source-id');
  });

  test('does not fabricate a dataSourceId when the URL has none', () => {
    const initialValues = getInitialValues({
      location: { search: '?action=edit-monitor' },
      monitorToEdit: pplMonitorToEdit,
      edit: true,
    });

    // Falls back to whatever the hydrator produced (no URL override applied).
    expect(initialValues.dataSourceId).not.toBe('my-data-source-id');
  });
});

describe('reinitializeForDataSource', () => {
  const overrides = { monitor_type: MONITOR_TYPE.QUERY_LEVEL, searchType: SEARCH_TYPE.GRAPH };
  const dataSourceProps = {
    dataSourceId: 'ds-2',
    dataSourceEndpoint: 'https://ds-2',
    monitorTypeOverrides: overrides,
  };

  test('keeps what the user typed into cluster-independent fields', () => {
    const initialValues = { name: '', description: '', index: [], monitor_type: MONITOR_TYPE.PPL };
    const liveValues = {
      name: 'latency monitor',
      description: 'p99 over 2s',
      period: { interval: 10, unit: 'MINUTES' },
      index: [{ label: 'logs-ds-1' }],
      timeField: '@timestamp',
    };

    const next = reinitializeForDataSource(initialValues, liveValues, dataSourceProps);

    expect(next.name).toBe('latency monitor');
    expect(next.description).toBe('p99 over 2s');
    expect(next.period).toEqual({ interval: 10, unit: 'MINUTES' });
    // cluster-bound fields are not carried over
    expect(next.index).toEqual([]);
    expect(next.timeField).toBeUndefined();
    expect(next.dataSourceId).toBe('ds-2');
    expect(next.dataSourceEndpoint).toBe('https://ds-2');
    expect(next.monitor_type).toBe(MONITOR_TYPE.QUERY_LEVEL);
    expect(next.searchType).toBe(SEARCH_TYPE.GRAPH);
  });

  test('falls back to the stored initialValues when the form is not mounted yet', () => {
    const initialValues = { name: 'from-url', description: 'd', index: [] };

    const next = reinitializeForDataSource(initialValues, undefined, dataSourceProps);

    expect(next.name).toBe('from-url');
    expect(next.dataSourceId).toBe('ds-2');
    expect(next.monitor_type).toBe(MONITOR_TYPE.QUERY_LEVEL);
  });
});

describe('getPlugins', () => {
  const okPlugins = {
    ok: true,
    resp: [{ component: 'opensearch-alerting' }, { component: 'opensearch-notifications' }],
  };
  const PLUGINS_URL = '../api/alerting/_plugins';
  const FEATURES_URL = '../api/notifications/features';
  const AD_URL = '../api/alerting/detectors/_available';
  // Answers by URL (the AD check runs alongside the listing, so call order isn't fixed). An Error
  // rejects; the AD check defaults to "not available".
  const httpClientFor = ({
    plugins = okPlugins,
    notifications,
    ad = { ok: true, available: false },
  }) => ({
    get: jest.fn(async (url) => {
      const answer = { [PLUGINS_URL]: plugins, [FEATURES_URL]: notifications, [AD_URL]: ad }[url];
      if (answer instanceof Error) throw answer;
      return answer;
    }),
  });
  const callTo = (httpClient, url) => httpClient.get.mock.calls.find(([called]) => called === url);

  test('returns the installed plugin list when the _plugins probe succeeds', async () => {
    const httpClient = httpClientFor({});
    await expect(getPlugins(httpClient)).resolves.toEqual([
      'opensearch-alerting',
      'opensearch-notifications',
    ]);
    // The listing and the AD check; no Notifications fallback.
    expect(callTo(httpClient, FEATURES_URL)).toBeUndefined();
  });
  test('falls back to the Notifications features route when the _plugins probe fails', async () => {
    const httpClient = httpClientFor({
      plugins: { ok: false, resp: 'forbidden' },
      notifications: { availableChannels: { slack: 'Slack', webhook: 'Webhook' } },
    });
    await expect(getPlugins(httpClient)).resolves.toEqual([OS_NOTIFICATION_PLUGIN]);
    expect(callTo(httpClient, FEATURES_URL)).toBeDefined();
  });
  test('sends dataSourceId="" for the local cluster when MDS is enabled', async () => {
    setDataSourceEnabled({ enabled: true });
    setDataSource({ dataSourceId: '' });
    const httpClient = httpClientFor({
      plugins: { ok: false, resp: 'forbidden' },
      notifications: { availableChannels: { slack: 'Slack' } },
    });
    await expect(getPlugins(httpClient)).resolves.toEqual([OS_NOTIFICATION_PLUGIN]);
    expect(callTo(httpClient, FEATURES_URL)).toEqual([
      FEATURES_URL,
      { query: { dataSourceId: '' } },
    ]);
    setDataSourceEnabled({ enabled: false });
  });
  test('passes the selected data source id to the features route', async () => {
    setDataSourceEnabled({ enabled: true });
    setDataSource({ dataSourceId: 'ds-9' });
    const httpClient = httpClientFor({
      plugins: new Error('forbidden'),
      notifications: { availableChannels: {} },
    });
    await expect(getPlugins(httpClient)).resolves.toEqual([OS_NOTIFICATION_PLUGIN]);
    expect(callTo(httpClient, FEATURES_URL)[1]).toEqual({ query: { dataSourceId: 'ds-9' } });
    // The AD check goes to the same data source.
    expect(callTo(httpClient, AD_URL)[1]).toEqual({ query: { dataSourceId: 'ds-9' } });
    setDataSourceEnabled({ enabled: false });
  });
  test('reports no plugins when both the probe and the Notifications route fail', async () => {
    const httpClient = httpClientFor({
      plugins: new Error('boom'),
      notifications: new Error('boom'),
    });
    await expect(getPlugins(httpClient)).resolves.toEqual([]);
  });
  describe('anomaly detection', () => {
    test('reports AD when _cat/plugins omits it but the AD check says available', async () => {
      const httpClient = httpClientFor({ ad: { ok: true, available: true } });
      await expect(getPlugins(httpClient)).resolves.toEqual([
        'opensearch-alerting',
        'opensearch-notifications',
        OS_AD_PLUGIN,
      ]);
    });

    test('leaves AD out when the AD check says unavailable or fails', async () => {
      await expect(
        getPlugins(httpClientFor({ ad: { ok: true, available: false } }))
      ).resolves.toEqual(['opensearch-alerting', 'opensearch-notifications']);
      await expect(getPlugins(httpClientFor({ ad: new Error('boom') }))).resolves.toEqual([
        'opensearch-alerting',
        'opensearch-notifications',
      ]);
    });

    test('reports AD when the plugin list could not be read', async () => {
      const httpClient = httpClientFor({
        plugins: { ok: false, resp: 'forbidden' },
        notifications: { availableChannels: {} },
        ad: { ok: true, available: true },
      });
      await expect(getPlugins(httpClient)).resolves.toEqual([OS_NOTIFICATION_PLUGIN, OS_AD_PLUGIN]);
    });

    test('keeps a listed AD without adding it twice', async () => {
      const httpClient = httpClientFor({
        plugins: { ok: true, resp: [{ component: OS_AD_PLUGIN }] },
        ad: { ok: true, available: true },
      });
      await expect(getPlugins(httpClient)).resolves.toEqual([OS_AD_PLUGIN]);
    });

    test('starts the AD check without waiting for the listing', async () => {
      let answerListing;
      const httpClient = {
        get: jest.fn((url) =>
          url === PLUGINS_URL
            ? new Promise((resolve) => (answerListing = resolve))
            : Promise.resolve({ ok: true, available: true })
        ),
      };
      const result = getPlugins(httpClient);
      expect(httpClient.get.mock.calls.map(([url]) => url)).toEqual([PLUGINS_URL, AD_URL]);
      answerListing(okPlugins);
      await expect(result).resolves.toContain(OS_AD_PLUGIN);
    });
  });
});
