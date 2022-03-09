/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import DashboardEmptyPrompt from './DashboardEmptyPrompt';

describe('DashboardEmptyPrompt', () => {
  test('renders', () => {
    const component = <DashboardEmptyPrompt monitorDetails={false} onShowTrigger={() => {}} />;
    expect(render(component)).toMatchSnapshot();
  });
});
