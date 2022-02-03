/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import OverviewStat from './OverviewStat';

describe('OverviewStat', () => {
  test('renders', () => {
    const component = <OverviewStat header="Test Header" value="Test Value" />;

    expect(render(component)).toMatchSnapshot();
  });
});
