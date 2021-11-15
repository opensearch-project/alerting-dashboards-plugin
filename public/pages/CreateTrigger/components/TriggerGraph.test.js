/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import TriggerGraph from './TriggerGraph';

describe('TriggerGraph', () => {
  test('renders', () => {
    const wrapper = shallow(<TriggerGraph />);
    expect(wrapper).toMatchSnapshot();
  });
});
