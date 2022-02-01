/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
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
