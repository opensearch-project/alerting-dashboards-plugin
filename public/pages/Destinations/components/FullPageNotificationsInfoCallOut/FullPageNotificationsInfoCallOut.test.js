/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import FullPageNotificationsInfoCallOut from './FullPageNotificationsInfoCallOut';

describe('FullPageNotificationsInfoCallOut', () => {
  test('renders when Notifications plugin is installed', () => {
    const component = <FullPageNotificationsInfoCallOut hasNotificationPlugin={true} />;
    expect(render(component)).toMatchSnapshot();
  });
  test('renders when Notifications plugin is not installed', () => {
    const component = <FullPageNotificationsInfoCallOut hasNotificationPlugin={false} />;
    expect(render(component)).toMatchSnapshot();
  });
});
