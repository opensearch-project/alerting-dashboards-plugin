/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import AddTriggerConditionButton from './AddTriggerConditionButton';

describe('AddTriggerConditionButton', () => {
  test('renders', () => {
    const wrapper = shallow(<AddTriggerConditionButton />);
    expect(wrapper).toMatchSnapshot();
  });
});
