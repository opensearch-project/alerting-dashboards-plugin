/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import AssociateExisting from './AssociateExisting';

describe('AssociateExisting', () => {
  test('renders', () => {
    const wrapper = shallow(<AssociateExisting {...{ embeddable: { getTitle: () => '' } }} />);
    expect(wrapper).toMatchSnapshot();
  });
});
