/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import AlertsDashboardFlyoutComponent from './AlertsDashboardFlyoutComponent';
import { historyMock } from '../../../../../test/mocks';

describe('AlertsDashboardFlyoutComponent', () => {
  test('renders', () => {
    const wrapper = shallow(
      <AlertsDashboardFlyoutComponent
        location={{ pathname: '/dashboard', search: '' }}
        flyout={{ type: 'message', payload: null }}
        onClose={jest.fn()}
        history={historyMock}
      />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
