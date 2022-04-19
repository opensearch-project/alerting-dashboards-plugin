/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import NotificationsCallOut from './NotificationsCallOut';

describe('NotifictionsCallOut', () => {
  test('renders', () => {
    const component = <NotificationsCallOut />;

    expect(render(component)).toMatchSnapshot();
  });
});
