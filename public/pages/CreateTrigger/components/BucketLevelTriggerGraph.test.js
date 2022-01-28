/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import BucketLevelTriggerGraph from './BucketLevelTriggerGraph';

describe('BucketLevelTriggerGraph', () => {
  test('renders', () => {
    const wrapper = shallow(<BucketLevelTriggerGraph />);
    expect(wrapper).toMatchSnapshot();
  });
});
