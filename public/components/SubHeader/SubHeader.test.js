/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import SubHeader from './SubHeader';

describe('SubHeader', () => {
  test('renders', () => {
    const component = <SubHeader description={<div>description</div>} title={<div>title</div>} />;
    expect(render(component)).toMatchSnapshot();
  });
});
