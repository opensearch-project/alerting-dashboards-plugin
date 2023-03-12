/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import AddAlertingMonitor from './AddAlertingMonitor';

describe('AddAlertingMonitor', () => {
  test('renders', () => {
    const wrapper = shallow(<AddAlertingMonitor {...{ embeddable: { getTitle: () => '' } }} />);
    expect(wrapper).toMatchSnapshot();
  });
});
