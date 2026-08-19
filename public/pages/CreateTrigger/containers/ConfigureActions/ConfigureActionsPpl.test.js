/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import ConfigureActionsPpl from './ConfigureActionsPpl';
import { MONITOR_TYPE } from '../../../../utils/constants';

jest.mock('../../../utils/helpers', () => ({
  ...jest.requireActual('../../../utils/helpers'),
  getDataSourceId: jest.fn(() => 'test-ds-id'),
}));

jest.mock('../../../../services', () => ({
  ...jest.requireActual('../../../../services'),
  isServerlessDataSource: jest.fn(() => false),
  getNotifications: jest.fn(),
}));

const buildFormikValues = () => ({
  name: 'PPL test monitor',
  monitor_type: MONITOR_TYPE.PPL,
  pplQuery: "source = `logs-*` | where body like '%[ERROR]%'",
  useLookBackWindow: false,
  frequency: 'interval',
  period: { interval: 1, unit: 'MINUTES' },
  triggerDefinitions: [
    {
      name: 'trigger one',
      severity: '4',
      num_results_condition: '>',
      num_results_value: 5,
      actions: [
        {
          id: 'action-0',
          name: 'Notification 1',
          destination_id: 'sns-channel-id',
          message_template: { source: 'hello', lang: 'mustache' },
          subject_template: { source: 'subject', lang: 'mustache' },
          throttle_enabled: false,
        },
        {
          id: 'action-1',
          name: 'Notification 2',
          destination_id: 'other-channel-id',
          message_template: { source: 'hello 2', lang: 'mustache' },
          subject_template: { source: 'subject 2', lang: 'mustache' },
          throttle_enabled: false,
        },
      ],
    },
  ],
});

const buildComponent = (httpClient) => {
  const props = {
    context: { monitor: { monitor_type: MONITOR_TYPE.PPL, ui_metadata: {} } },
    httpClient,
    notifications: { toasts: { addSuccess: jest.fn(), addDanger: jest.fn() } },
    triggerIndex: 0,
    values: buildFormikValues(),
    fieldPath: '',
    flyoutMode: '',
  };
  const component = new ConfigureActionsPpl(props);
  component.state = { ...component.state, flattenedDestinations: [] };
  return component;
};

describe('ConfigureActionsPpl sendTestMessage for PPL monitors', () => {
  test('dispatches PPL monitors to the v2 _execute endpoint', async () => {
    const httpClient = { post: jest.fn().mockResolvedValue({ ok: true, resp: {} }) };
    const component = buildComponent(httpClient);

    await component.sendTestMessage(0);

    expect(httpClient.post).toHaveBeenCalledTimes(1);
    const [url, options] = httpClient.post.mock.calls[0];
    expect(url).toBe('/api/alerting/v2/monitors/_execute');
    // v2 route query schema only accepts dataSourceId (no dryrun, unlike v1)
    expect(options.query).toEqual({ dataSourceId: 'test-ds-id' });
  });

  test('sends a v2 ppl_monitor payload with no v1 query-level trigger shape', async () => {
    const httpClient = { post: jest.fn().mockResolvedValue({ ok: true, resp: {} }) };
    const component = buildComponent(httpClient);

    await component.sendTestMessage(0);

    const body = JSON.parse(httpClient.post.mock.calls[0][1].body);
    // v2 shape: everything under ppl_monitor
    expect(body.ppl_monitor).toBeDefined();
    expect(body.ppl_monitor.query).toContain('source =');
    // No v1 artifacts: no top-level triggers, no search/match_all inputs
    expect(body.triggers).toBeUndefined();
    expect(body.inputs).toBeUndefined();
    // Trigger must be ppl-typed, not a painless condition script
    const trigger = body.ppl_monitor.triggers[0];
    expect(trigger.condition).toBeUndefined();
    expect(trigger.type).toBe('number_of_results');
  });

  test('forces an always-firing condition and keeps only the tested action', async () => {
    const httpClient = { post: jest.fn().mockResolvedValue({ ok: true, resp: {} }) };
    const component = buildComponent(httpClient);

    await component.sendTestMessage(1); // test the SECOND action

    const body = JSON.parse(httpClient.post.mock.calls[0][1].body);
    const trigger = body.ppl_monitor.triggers[0];
    expect(body.ppl_monitor.triggers).toHaveLength(1);
    expect(trigger.num_results_condition).toBe('>=');
    expect(trigger.num_results_value).toBe(0);
    expect(trigger.actions).toHaveLength(1);
    expect(trigger.actions[0].destination_id).toBe('other-channel-id');
  });

  test('non-PPL monitors still use the v1 _execute endpoint', async () => {
    const httpClient = { post: jest.fn().mockResolvedValue({ ok: true, resp: {} }) };
    const component = buildComponent(httpClient);
    component.props.context.monitor = {
      monitor_type: MONITOR_TYPE.QUERY_LEVEL,
      ui_metadata: { triggers: {} },
      name: 'v1 monitor',
      schedule: { period: { interval: 1, unit: 'MINUTES' } },
    };
    component.props.values = {
      ...component.props.values,
      monitor_type: MONITOR_TYPE.QUERY_LEVEL,
      triggerDefinitions: [
        {
          name: 'trigger one',
          severity: '1',
          script: { lang: 'painless', source: 'return true' },
          actions: [{ id: 'a0', name: 'act', destination_id: 'd0' }],
        },
      ],
    };

    await component.sendTestMessage(0);

    expect(httpClient.post).toHaveBeenCalledTimes(1);
    expect(httpClient.post.mock.calls[0][0]).toBe('/api/alerting/monitors/_execute');
  });

  test('surfaces backend errors via backendErrorNotification path without throwing', async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({ ok: false, resp: 'boom' }),
    };
    const component = buildComponent(httpClient);

    await expect(component.sendTestMessage(0)).resolves.not.toThrow();
    expect(component.props.notifications.toasts.addSuccess).not.toHaveBeenCalled();
  });
});
