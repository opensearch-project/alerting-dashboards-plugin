/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import EmptyHistory from './EmptyHistory';

describe('<EmptyHistory/>', () => {
  test('renders', () => {
    expect(render(<EmptyHistory onShowTrigger={jest.fn()} />)).toMatchSnapshot();
  });
});
