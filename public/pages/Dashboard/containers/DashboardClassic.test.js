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
    getUseUpdatedUx: jest.fn(() => false),
  };
});

import DashboardClassic from './DashboardClassic';
import {
  setDataSourceEnabled,
  setDataSource,
  setAssistantClient,
} from '../../../services/services';
import { historyMock, httpClientMock } from '../../../../test/mocks';
import { setupCoreStart } from '../../../../test/utils/helpers';

const location = {
  hash: '',
  search: '',
  state: undefined,
};

const getAlertsQuery = () => {
  const call = httpClientMock.get.mock.calls.find(([path]) => path === '../api/alerting/alerts');
  return call ? call[1].query : undefined;
};

beforeAll(() => {
  setupCoreStart();
  // The agent-config lookup runs during mount; provide a stub so the real code
  // path resolves instead of throwing "AssistantClient was not set."
  setAssistantClient({ agentConfigExists: jest.fn().mockResolvedValue({ exists: false }) });
});

describe('DashboardClassic getAlerts (issue #1488)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    httpClientMock.get.mockResolvedValue({
      ok: true,
      alerts: [],
      totalAlerts: 0,
      resp: { totalAlerts: 0, alerts: [] },
    });
  });

  afterEach(() => {
    // Reset the module-level MDS singletons to their default.
    setDataSourceEnabled({ enabled: false });
    setDataSource({ dataSourceId: undefined });
  });

  const mount = (props = {}) =>
    shallow(
      <DashboardClassic
        httpClient={httpClientMock}
        history={historyMock}
        location={location}
        perAlertView={true}
        monitorIds={['monitor-1']}
        {...props}
      />
    );

  test('fetches alerts for a local-cluster monitor when the data source feature is enabled', () => {
    // Regression for #1488: data_source.enabled is true, but this is a plain
    // local-cluster monitor with no data source association, so no dataSourceId
    // resolves. The request must still be issued (previously an early-return
    // guard silently no-op'd here, rendering a blank page).
    setDataSourceEnabled({ enabled: true });
    setDataSource({ dataSourceId: undefined });

    mount();

    const query = getAlertsQuery();
    expect(query).toBeDefined();
    // Local cluster -> dataSourceId must be omitted (the server treats a missing
    // dataSourceId as "use the local cluster").
    expect(query).not.toHaveProperty('dataSourceId');
    expect(query.monitorIds).toEqual(['monitor-1']);
  });

  test('includes dataSourceId when the data source feature is enabled and a data source resolves', () => {
    setDataSourceEnabled({ enabled: true });
    setDataSource({ dataSourceId: 'ds-123' });

    mount();

    const query = getAlertsQuery();
    expect(query).toBeDefined();
    expect(query.dataSourceId).toBe('ds-123');
  });

  test('fetches alerts when the data source feature is disabled', () => {
    setDataSourceEnabled({ enabled: false });

    mount();

    const query = getAlertsQuery();
    expect(query).toBeDefined();
    expect(query).not.toHaveProperty('dataSourceId');
  });
});
