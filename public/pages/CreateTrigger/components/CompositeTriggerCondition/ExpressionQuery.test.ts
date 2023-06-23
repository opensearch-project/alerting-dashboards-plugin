/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';

describe('<SelectionExpField /> spec', () => {
  it('renders the component', () => {
    const tree = render(<ExpressionQuery />);
    expect(tree).toMatchSnapshot();
  });
});
