/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import ContentPanel from './ContentPanel';

describe('ContentPanel', () => {
  test('renders', () => {
    const component = (
      <ContentPanel title="Test Content Panel">
        <div>Test</div>
      </ContentPanel>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
