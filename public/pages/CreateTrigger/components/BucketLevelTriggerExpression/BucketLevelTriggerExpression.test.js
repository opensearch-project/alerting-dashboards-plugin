/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import BucketLevelTriggerExpression from './BucketLevelTriggerExpression';

describe('BucketLevelTriggerExpression', () => {
  test('renders', () => {
    const wrapper = shallow(<BucketLevelTriggerExpression />);
    expect(wrapper).toMatchSnapshot();
  });
});
