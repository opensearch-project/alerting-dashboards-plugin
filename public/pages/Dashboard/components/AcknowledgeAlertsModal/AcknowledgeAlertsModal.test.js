/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { historyMock, httpClientMock } from '../../../../../test/mocks';
import AcknowledgeAlertsModal from './AcknowledgeAlertsModal';
import { FORMIK_INITIAL_VALUES } from '../../../CreateMonitor/containers/CreateMonitor/utils/constants';
import coreMock from '../../../../../test/mocks/CoreMock';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AcknowledgeAlertsModal', () => {
  test('renders', () => {
    const location = {
      hash: '',
      pathname: '/dashboard',
      search: '',
      state: undefined,
    };
    const notifications = _.cloneDeep(coreMock.notifications);
    const component = (
      <AcknowledgeAlertsModal
        httpClient={httpClientMock}
        history={historyMock}
        location={location}
        monitor={FORMIK_INITIAL_VALUES}
        monitorId={'fake_monitor_id'}
        notifications={notifications}
        triggerId={'fake_trigger_id'}
        triggerName={'fake_trigger_name'}
        onClose={() => {}}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
