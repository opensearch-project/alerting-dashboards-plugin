/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertInsight } from './AlertInsight';
import { getApplication, getAssistantDashboards, getClient } from '../../services';
import { searchQuery } from '../../pages/Dashboard/utils/helpers';

jest.mock('../../services', () => ({
  getApplication: jest.fn(),
  getAssistantDashboards: jest.fn(),
  getClient: jest.fn(),
}));

jest.mock('../../pages/utils/helpers', () => ({
  dataSourceEnabled: () => false,
}));

jest.mock('../../pages/Dashboard/utils/helpers', () => ({
  ...jest.requireActual('../../pages/Dashboard/utils/helpers'),
  searchQuery: jest.fn(),
}));

const LAST_NOTIFICATION_TIME = 1700000000000;
const TEN_MINUTES = 10 * 60 * 1000;

// Range clause as GET monitor returns it: the backend re-serializes the query, so the bounds are
// from/to and format is followed by boost
const buildRange = (from, to) => ({
  from,
  to,
  include_lower: true,
  include_upper: true,
  format: 'epoch_millis',
  boost: 1,
});

const buildMonitor = (schedule, range = buildRange('{{period_start}}', '{{period_end}}')) => ({
  monitor_type: 'query_level_monitor',
  schedule,
  inputs: [
    {
      search: {
        indices: ['logs'],
        query: {
          size: 0,
          query: { bool: { filter: [{ range: { '@timestamp': range } }] } },
        },
      },
    },
  ],
});

const getRange = (queryString) => JSON.parse(queryString).query.bool.filter[0].range['@timestamp'];

const getContextProvider = (monitor, lastNotificationTime = LAST_NOTIFICATION_TIME) => {
  const registerIncontextInsight = jest.fn();
  getApplication.mockReturnValue({ capabilities: { assistant: { enabled: true } } });
  getAssistantDashboards.mockReturnValue({
    getFeatureStatus: () => ({ alertInsight: true }),
    registerIncontextInsight,
    renderIncontextInsight: jest.fn(),
  });
  getClient.mockReturnValue({ get: jest.fn().mockResolvedValue({ resp: monitor }) });

  AlertInsight({
    alert: {
      monitor_id: 'monitor-id',
      trigger_name: 'trigger',
      start_time: LAST_NOTIFICATION_TIME,
      last_notification_time: lastNotificationTime,
    },
    alertId: 'alert-id',
    isAgentConfigured: true,
  });

  return registerIncontextInsight.mock.calls[0][0][0].contextProvider;
};

describe('AlertInsight', () => {
  const interval = { period: { interval: 10, unit: 'MINUTES' } };
  const cron = { cron: { expression: '0 * * * *', timezone: 'UTC' } };

  beforeEach(() => {
    jest.clearAllMocks();
    searchQuery.mockResolvedValue({ body: { hits: { total: { value: 3 } } } });
  });

  test('searches the period of the run that raised the alert', async () => {
    await getContextProvider(buildMonitor(interval))();

    expect(searchQuery).toHaveBeenCalledTimes(1);
    expect(getRange(searchQuery.mock.calls[0][4])).toEqual(
      buildRange(String(LAST_NOTIFICATION_TIME - TEN_MINUTES), String(LAST_NOTIFICATION_TIME))
    );
  });

  test('passes on a dsl with ISO dates and without the epoch_millis format', async () => {
    const { additionalInfo, context } = await getContextProvider(buildMonitor(interval))();

    const range = getRange(additionalInfo.dsl);
    expect(range.from).toBe('2023-11-14T22:03:20+00:00');
    expect(range.to).toBe('2023-11-14T22:13:20+00:00');
    expect(range).not.toHaveProperty('format');
    expect(context).not.toContain('{{period_');
    expect(context).not.toContain('epoch_millis');
  });

  test('drops the format also when it is the last key of the range', async () => {
    const { additionalInfo } = await getContextProvider(
      buildMonitor(interval, {
        gte: '{{period_start}}',
        lte: '{{period_end}}',
        format: 'epoch_millis',
      })
    )();

    expect(getRange(additionalInfo.dsl)).toEqual({
      gte: '2023-11-14T22:03:20+00:00',
      lte: '2023-11-14T22:13:20+00:00',
    });
  });

  test('resolves placeholders written with spaces', async () => {
    await getContextProvider(
      buildMonitor(interval, buildRange('{{ period_start }}', '{{ period_end }}'))
    )();

    expect(getRange(searchQuery.mock.calls[0][4]).from).toBe(
      String(LAST_NOTIFICATION_TIME - TEN_MINUTES)
    );
  });

  test('neither searches nor passes on dsl when {{period_start}} cannot be resolved', async () => {
    const { additionalInfo, context } = await getContextProvider(buildMonitor(cron))();

    expect(searchQuery).not.toHaveBeenCalled();
    expect(additionalInfo.dsl).toBe('');
    expect(context).toContain('Here is the detail information about alert trigger');
  });

  test('keeps the dsl when only aggregations use an unresolved {{period_start}}', async () => {
    const monitor = buildMonitor(cron, buildRange('{{period_end}}||-1h', '{{period_end}}'));
    monitor.inputs[0].search.query.aggs = {
      histogram: {
        date_histogram: {
          field: '@timestamp',
          fixed_interval: '1m',
          extended_bounds: { min: '{{period_start}}', max: '{{period_end}}' },
        },
      },
    };
    const { additionalInfo } = await getContextProvider(monitor)();

    expect(searchQuery).not.toHaveBeenCalled();
    expect(getRange(additionalInfo.dsl).to).toBe('2023-11-14T22:13:20+00:00');
  });

  test('neither searches nor passes on dsl when the alert has no notification time', async () => {
    const { additionalInfo } = await getContextProvider(buildMonitor(interval), null)();

    expect(searchQuery).not.toHaveBeenCalled();
    expect(additionalInfo.dsl).toBe('');
  });

  test('still searches a cron monitor that only uses {{period_end}}', async () => {
    await getContextProvider(
      buildMonitor(cron, buildRange('{{period_end}}||-1h', '{{period_end}}'))
    )();

    expect(searchQuery).toHaveBeenCalledTimes(1);
    expect(getRange(searchQuery.mock.calls[0][4]).from).toBe(`${LAST_NOTIFICATION_TIME}||-1h`);
  });
});
