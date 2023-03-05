/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import AssociatedMonitors from './AssociatedMonitors';

describe('AssociatedMonitors', () => {
  test('renders', () => {
    const wrapper = shallow(<AssociatedMonitors {...{ embeddable: { getTitle: () => '' } }} />);
    expect(wrapper).toMatchSnapshot();
  });
});
