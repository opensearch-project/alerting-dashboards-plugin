/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import Container from './Container';

describe('Container', () => {
  test('renders', () => {
    const wrapper = shallow(
      <Container {...{ startingPanel: 'add', embeddable: { getTitle: () => '' } }} />
    );
    expect(wrapper).toMatchSnapshot();
  });
});
