/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import MonitorOverview from './MonitorOverview';

describe('MonitorOverview', () => {
  test('renders', () => {
    const component = (
      <MonitorOverview
        monitor={{
          enabled: true,
          schedule: { period: { interval: 5, unit: 'MINUTES' } },
          ui_metadata: {
            search: { searchType: 'query' },
            schedule: {
              frequency: 'interval',
              period: { interval: 5, unit: 'MINUTES' },
            },
          },
        }}
        monitorVersion={3}
        dayCount={5}
        activeCount={17}
      />
    );

    expect(render(component)).toMatchSnapshot();
  });
});
