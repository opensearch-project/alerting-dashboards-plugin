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
    isPplAlertingEnabled: jest.fn(),
    getUseUpdatedUx: jest.fn(() => false),
  };
});

jest.mock('../../utils/helpers', () => {
  const helpers = jest.requireActual('../../utils/helpers');
  return {
    ...helpers,
    getIsAgentConfigured: jest.fn().mockResolvedValue(false),
  };
});

import Dashboard from './Dashboard';
import DashboardClassic from './DashboardClassic';
import DashboardRouter from './DashboardRouter';
import { historyMock, httpClientMock } from '../../../../test/mocks';
import { setupCoreStart } from '../../../../test/utils/helpers';
import { isPplAlertingEnabled } from '../../../services';

const location = {
  hash: '',
  search: '',
  state: undefined,
};

beforeAll(() => {
  setupCoreStart();
});

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    httpClientMock.get.mockResolvedValue({
      ok: true,
      alerts: [],
      totalAlerts: 0,
      resp: { total_alerts_v2: 0, alerts: [] },
    });
  });

  const render = (props = {}) =>
    shallow(
      <Dashboard httpClient={httpClientMock} history={historyMock} location={location} {...props} />
    );

  test('renders DashboardClassic when PPL alerting is disabled', () => {
    isPplAlertingEnabled.mockReturnValue(false);

    const wrapper = render({ perAlertView: true });

    expect(wrapper.find(DashboardClassic).exists()).toBe(true);
    expect(wrapper.find(DashboardRouter).exists()).toBe(false);
  });

  test('renders DashboardRouter when PPL alerting is enabled', () => {
    isPplAlertingEnabled.mockReturnValue(true);

    const wrapper = render({ perAlertView: true });

    expect(wrapper.find(DashboardRouter).exists()).toBe(true);
    expect(wrapper.find(DashboardClassic).exists()).toBe(false);
  });

  test('forwards props to the rendered dashboard', () => {
    isPplAlertingEnabled.mockReturnValue(false);
    const perAlertView = false;

    const wrapper = shallow(
      <Dashboard
        httpClient={httpClientMock}
        history={historyMock}
        location={location}
        perAlertView={perAlertView}
        monitorIds={['monitor-1']}
      />
    );

    const renderedDashboard = wrapper.find(DashboardClassic);
    expect(renderedDashboard.exists()).toBe(true);
    expect(renderedDashboard.prop('perAlertView')).toBe(perAlertView);
    expect(renderedDashboard.prop('monitorIds')).toEqual(['monitor-1']);
  });
});
