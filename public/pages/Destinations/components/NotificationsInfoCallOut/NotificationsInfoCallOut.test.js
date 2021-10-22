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
