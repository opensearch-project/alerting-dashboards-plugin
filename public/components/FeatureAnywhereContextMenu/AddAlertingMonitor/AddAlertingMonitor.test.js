/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { httpServiceMock, notificationServiceMock } from '../../../../../../src/core/public/mocks';
import { shallow } from 'enzyme';
import AddAlertingMonitor from './AddAlertingMonitor';
import { setClient, setNotifications } from '../../../services';
import { setupCoreStart } from '../../../../test/utils/helpers';

beforeAll(() => {
  setupCoreStart();
});

describe('AddAlertingMonitor', () => {
  const httpClient = httpServiceMock.createStartContract();
  setClient(httpClient);
  const notifications = notificationServiceMock.createStartContract();
  setNotifications(notifications);
  test('renders', () => {
    const wrapper = shallow(<AddAlertingMonitor {...{ embeddable: { vis: { title: '' } } }} />);
    expect(wrapper).toMatchSnapshot();
  });
});
