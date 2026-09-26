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

const buildMonitor = (schedule) => ({
  monitor_type: 'query_level_monitor',
  schedule,
  inputs: [
    {
      search: {
        indices: ['logs'],
        query: {
          size: 0,
          query: {
            bool: {
              filter: [
                {
                  range: {
                    '@timestamp': {
                      gte: '{{period_start}}',
                      lte: '{{period_end}}',
                      format: 'epoch_millis',
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
  ],
});

const getContextProvider = async (monitor) => {
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
      last_notification_time: LAST_NOTIFICATION_TIME,
    },
    alertId: 'alert-id',
    isAgentConfigured: true,
  });

  return registerIncontextInsight.mock.calls[0][0][0].contextProvider;
};

describe('AlertInsight', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchQuery.mockResolvedValue({ body: { hits: { total: { value: 3 } } } });
  });

  test('replaces {{period_start}} and {{period_end}} for interval schedules', async () => {
    const contextProvider = await getContextProvider(
      buildMonitor({ period: { interval: 10, unit: 'MINUTES' } })
    );
    const { additionalInfo } = await contextProvider();

    expect(searchQuery).toHaveBeenCalledTimes(1);
    const range = JSON.parse(searchQuery.mock.calls[0][4]).query.bool.filter[0].range['@timestamp'];
    expect(range.gte).toBe(String(LAST_NOTIFICATION_TIME - 10 * 60 * 1000));
    expect(range.lte).toBe(String(LAST_NOTIFICATION_TIME));
    expect(additionalInfo.dsl).not.toContain('{{period_');
  });

  test('skips the search when {{period_start}} cannot be resolved for cron schedules', async () => {
    const contextProvider = await getContextProvider(
      buildMonitor({ cron: { expression: '0 * * * *', timezone: 'UTC' } })
    );
    const { context } = await contextProvider();

    expect(searchQuery).not.toHaveBeenCalled();
    expect(context).toContain('Here is the detail information about alert trigger');
  });
});
