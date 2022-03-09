/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import ActionEmptyPrompt from './ActionEmptyPrompt';

describe('ActionEmptyPrompt', () => {
  test('renders', () => {
    const wrapper = shallow(<ActionEmptyPrompt />);
    expect(wrapper).toMatchSnapshot();
  });
});
