/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import AddTriggerButton from './AddTriggerButton';

describe('AddTriggerButton', () => {
  test('renders', () => {
    const wrapper = shallow(<AddTriggerButton />);
    expect(wrapper).toMatchSnapshot();
  });
});
