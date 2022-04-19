/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import NotificationsInfoCallOut from './NotificationsInfoCallOut';

describe('NotificationsInfoCallOut', () => {
  test('renders when Notifications plugin is installed', () => {
    const component = <NotificationsInfoCallOut hasNotificationPlugin={true} />;

    expect(render(component)).toMatchSnapshot();
  });
  test('renders when Notifications plugin is not installed', () => {
    const component = <NotificationsInfoCallOut hasNotificationPlugin={false} />;

    expect(render(component)).toMatchSnapshot();
  });
});
