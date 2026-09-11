/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';

jest.mock('../../../services', () => {
  const services = jest.requireActual('../../../services/services');
  return {
    ...services,
    NotificationService: function NotificationServiceMock() {},
    getUseUpdatedUx: jest.fn(() => false),
  };
});

jest.mock('../../utils/helpers', () => {
  const helpers = jest.requireActual('../../utils/helpers');
  return {
    ...helpers,
    getIsAgentConfigured: jest.fn().mockResolvedValue(false),
    getDataSourceQueryObj: jest.fn(() => ({ query: { dataSourceId: 'test-ds-id' } })),
  };
});

import DashboardClassic from './DashboardClassic';
import { historyMock, httpClientMock } from '../../../../test/mocks';
import { setupCoreStart } from '../../../../test/utils/helpers';

const location = {
  hash: '',
  search: '',
  state: undefined,
};

const notifications = {
  toasts: {
    addSuccess: jest.fn(),
    addDanger: jest.fn(),
  },
};

const monitorDetail = {
  ok: true,
  resp: {
    name: 'test-monitor',
    enabled: true,
    monitor_type: 'ppl_monitor',
    schedule: { period: { interval: 1, unit: 'MINUTES' } },
    triggers: [],
  },
  ifSeqNo: 7,
  ifPrimaryTerm: 2,
};

describe('DashboardClassic disableSelectedMonitors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    httpClientMock.get.mockResolvedValue({
      ok: true,
      alerts: [],
      totalAlerts: 0,
      resp: { totalAlerts: 0, alerts: [] },
    });
    httpClientMock.put.mockResolvedValue({ ok: true });
  });

  beforeAll(() => {
    setupCoreStart();
  });

  const render = (props = {}) =>
    shallow(
      <DashboardClassic
        httpClient={httpClientMock}
        history={historyMock}
        location={location}
        notifications={notifications}
        perAlertView={true}
        {...props}
      />
    );

  test('fetches the full monitor and writes it back with enabled=false', async () => {
    const wrapper = render();
    const instance = wrapper.instance();
    httpClientMock.get.mockResolvedValue(monitorDetail);

    instance.setState({
      selectedItems: [
        { id: 'alert-1', monitor_id: 'monitor-1' },
        // Same monitor selected via a second alert -- must only disable once
        { id: 'alert-2', monitor_id: 'monitor-1' },
      ],
    });
    await instance.disableSelectedMonitors();

    expect(httpClientMock.get).toHaveBeenCalledWith(
      '../api/alerting/monitors/monitor-1',
      expect.objectContaining({ query: { dataSourceId: 'test-ds-id' } })
    );
    expect(httpClientMock.put).toHaveBeenCalledTimes(1);
    const [url, { query, body }] = httpClientMock.put.mock.calls[0];
    expect(url).toBe('../api/alerting/monitors/monitor-1');
    expect(query).toEqual({ ifSeqNo: 7, ifPrimaryTerm: 2, dataSourceId: 'test-ds-id' });
    const payload = JSON.parse(body);
    expect(payload.enabled).toBe(false);
    expect(payload.name).toBe('test-monitor');
    expect(notifications.toasts.addSuccess).toHaveBeenCalledWith('Disabled 1 monitor.');
    expect(wrapper.state('selectedItems')).toEqual([]);
  });

  test('skips chained/workflow alerts', async () => {
    const wrapper = render();
    const instance = wrapper.instance();

    instance.setState({
      selectedItems: [
        { id: 'alert-1', monitor_id: 'workflow-1', alert_source: 'workflow' },
        { id: 'alert-2', workflow_id: 'workflow-2', monitor_id: 'delegate-1' },
      ],
    });
    httpClientMock.get.mockClear();
    await instance.disableSelectedMonitors();

    expect(httpClientMock.get).not.toHaveBeenCalled();
    expect(httpClientMock.put).not.toHaveBeenCalled();
    expect(notifications.toasts.addSuccess).not.toHaveBeenCalled();
  });

  test('surfaces a backend error notification when the update fails', async () => {
    const wrapper = render();
    const instance = wrapper.instance();
    httpClientMock.get.mockResolvedValue(monitorDetail);
    httpClientMock.put.mockResolvedValue({ ok: false, resp: 'boom' });

    instance.setState({ selectedItems: [{ id: 'alert-1', monitor_id: 'monitor-1' }] });
    await instance.disableSelectedMonitors();

    expect(notifications.toasts.addDanger).toHaveBeenCalled();
    expect(notifications.toasts.addSuccess).not.toHaveBeenCalled();
  });

  test('surfaces a backend error notification when the request throws', async () => {
    const wrapper = render();
    const instance = wrapper.instance();
    httpClientMock.get.mockResolvedValue(monitorDetail);
    httpClientMock.put.mockRejectedValue(new Error('socket hang up'));

    instance.setState({ selectedItems: [{ id: 'alert-1', monitor_id: 'monitor-1' }] });
    await instance.disableSelectedMonitors();

    expect(notifications.toasts.addDanger).toHaveBeenCalled();
    expect(notifications.toasts.addSuccess).not.toHaveBeenCalled();
  });
});
