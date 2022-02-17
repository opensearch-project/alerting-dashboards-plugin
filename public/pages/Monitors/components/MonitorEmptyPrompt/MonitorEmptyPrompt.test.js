/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import MonitorEmptyPrompt from './MonitorEmptyPrompt';

describe('MonitorEmptyPrompt', () => {
  test('renders', () => {
    const component = <MonitorEmptyPrompt />;

    expect(render(component)).toMatchSnapshot();
  });
});
