/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { notificationServiceMock } from '../../../../../../src/core/public/mocks';
import { shallow } from 'enzyme';
import AssociatedMonitors from './AssociatedMonitors';
import { setNotifications } from '../../../services';

describe('AssociatedMonitors', () => {
  test('renders', () => {
    const notificationsMock = notificationServiceMock.createSetupContract();
    setNotifications(notificationsMock);
    const wrapper = shallow(<AssociatedMonitors {...{ embeddable: { vis: { title: '' } } }} />);
    expect(wrapper).toMatchSnapshot();
  });
});
