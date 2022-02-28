/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import moment from 'moment';
import { render } from 'enzyme';
import POIChart from './POIChart';

const startTime = moment('2018-10-29T09:18:00');

const data = Array(5)
  .fill(1)
  .map((item, index) => ({
    x: startTime.add(2 * index + 1, 'm').valueOf(),
    y: 1 * index + 5,
  }));

describe('<POIChart/>', () => {
  test('renders', () => {
    expect(
      render(
        <POIChart
          highlightedArea={{
            startTime: moment('2018-10-29T09:28:00').valueOf(),
            endTime: moment('2018-10-29T09:30:00').valueOf(),
          }}
          data={data}
          onDragStart={() => {}}
          onDragEnd={() => {}}
          xDomain={[
            moment('2018-10-29T09:00:00').valueOf(),
            moment('2018-10-29T09:30:00').valueOf(),
          ]}
          yDomain={[0, 10]}
        />
      )
    ).toMatchSnapshot();
  });
});
