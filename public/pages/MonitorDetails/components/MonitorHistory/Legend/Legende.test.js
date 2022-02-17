/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import Legend from './Legend';

describe('<Legend/>', () => {
  test('renders', () => {
    expect(render(<Legend />)).toMatchSnapshot();
  });
});
