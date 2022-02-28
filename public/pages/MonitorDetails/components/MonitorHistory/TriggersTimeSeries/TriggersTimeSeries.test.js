/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import moment from 'moment';
import { render } from 'enzyme';
import TriggersTimeSeries from './TriggersTimeSeries';

describe('<TriggersTimeSeries/>', () => {
  test('renders', () => {
    expect(
      render(
        <TriggersTimeSeries
          triggers={[{ id: '1', name: 'Trigger 1' }]}
          triggersData={{
            1: [
              {
                x0: moment('2018-10-29T09:00:00').valueOf(),
                x: moment('2018-10-29T09:15:00').valueOf(),
                state: 'NO_ALERTS',
                meta: {
                  state: '',
                },
              },
              {
                x0: moment('2018-10-29T09:15:00').valueOf(),
                x: moment('2018-10-29T09:18:00').valueOf(),
                state: 'TRIGGERED',
                meta: {
                  state: '',
                },
              },
              {
                x0: moment('2018-10-29T09:18:00').valueOf(),
                x: moment('2018-10-29T09:30:00').valueOf(),
                state: 'NO_ALERTS',
                meta: {
                  state: '',
                },
              },
            ],
          }}
          domainBounds={{
            startTime: moment('2018-10-29T09:00:00').valueOf(),
            endTime: moment('2018-10-29T09:30:00').valueOf(),
          }}
        />
      )
    ).toMatchSnapshot();
  });
});
