/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import AddActionButton from './AddActionButton';

describe('AddActionButton', () => {
  test('renders', () => {
    const wrapper = shallow(<AddActionButton />);
    expect(wrapper).toMatchSnapshot();
  });
});
