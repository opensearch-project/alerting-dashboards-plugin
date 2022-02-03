/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import {
  getYTitle,
  getLeftPadding,
  getXDomain,
  getYDomain,
  formatYAxisTick,
  getAnnotationData,
  getDataFromResponse,
  getXYValues,
  filterInvalidYValues,
  getMarkData,
  getAggregationTitle,
} from './helpers';
import { DEFAULT_MARK_SIZE } from './constants';
import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import { MONITOR_TYPE } from '../../../../../utils/constants';

describe('getYTitle', () => {
  test('returns count when empty array, undefined, or null', () => {
    expect(getYTitle([])).toBe('doc_count');
    expect(getYTitle(undefined)).toBe('doc_count');
    expect(getYTitle(null)).toBe('doc_count');
  });
});

describe('getLeftPadding', () => {
  test('returns 60 when highest string length of yDomain <= 9', () => {
    expect(getLeftPadding([0, 9])).toBe(80);
    expect(getLeftPadding([0, 999999])).toBe(80);
    expect(getLeftPadding([0, 999999999])).toBe(80);
    expect(getLeftPadding([-9, 999999999])).toBe(80);
    expect(getLeftPadding([-99999, 999999999])).toBe(80);
    expect(getLeftPadding([-99999999, 999999999])).toBe(80);
  });

  test('returns correct padding when string length over 9', () => {
    expect(getLeftPadding([0, 9999999999])).toBe(90);
    expect(getLeftPadding([-999999999, 9])).toBe(90);
    expect(getLeftPadding([-999999999999, 9])).toBe(120);
    expect(getLeftPadding([0, 999999999999999])).toBe(140);
  });
});

describe('getXDomain', () => {
  test('gets x domains', () => {
    const data = [
      { y: 440, x: '2019-01-30T07:00:00.000-08:00' },
      { y: 440, x: '2019-01-30T08:00:00.000-08:00' },
    ];
    const xDomain = getXDomain(data);
    const expectedXDomain = [data[0].x, data[data.length - 1].x];
    expect(xDomain).toEqual(expectedXDomain);
  });
});

describe('getYDomain', () => {
  test('returns [0, 10] defaults when no data', () => {
    expect(getYDomain([])).toEqual([0, 10]);
  });

  test('returns [0, 10] defaults when min and max are 0', () => {
    expect(getYDomain([{ y: 0 }])).toEqual([0, 10]);
    expect(getYDomain([{ y: 0 }, { y: 0 }])).toEqual([0, 10]);
  });

  test('returns correct yDomain with buffered domain values', () => {
    expect(getYDomain([{ y: 50 }])).toEqual([0, 70]);
    expect(getYDomain([{ y: -50 }])).toEqual([-70, 0]);
    expect(getYDomain([{ y: -50 }, { y: 50 }])).toEqual([-70, 70]);
    expect(getYDomain([{ y: -51 }, { y: 51 }])).toEqual([-72, 72]);
  });
});

describe('formatYAxisTick', () => {
  const value = 5000;
  test('returns formatted locale string', () => {
    expect(formatYAxisTick(value)).toBe(value.toLocaleString());
  });
});

describe('getAnnotationData', () => {
  const minDate = new Date();
  const maxDate = new Date();
  test('returns yDomain max as annotation y value if threshold above yDomain max', () => {
    expect(getAnnotationData([minDate, maxDate], [0, 10], 50)).toEqual([
      { x: minDate, y: 10 },
      { x: maxDate, y: 10 },
    ]);
  });

  test('returns yDomain min as annotation y value if threshold below yDomain min', () => {
    expect(getAnnotationData([minDate, maxDate], [0, 10], -50)).toEqual([
      { x: minDate, y: 0 },
      { x: maxDate, y: 0 },
    ]);
  });

  test('returns threshold value as annotation y if it falls within yDomain', () => {
    expect(getAnnotationData([minDate, maxDate], [0, 10], 5)).toEqual([
      { x: minDate, y: 5 },
      { x: maxDate, y: 5 },
    ]);
  });
});

describe('filterInvalidYValues', () => {
  test('returns true for valid y values', () => {
    expect(filterInvalidYValues({ y: -50 })).toBe(true);
    expect(filterInvalidYValues({ y: 0 })).toBe(true);
    expect(filterInvalidYValues({ y: 100 })).toBe(true);
    expect(filterInvalidYValues({ y: 999999 })).toBe(true);
  });

  test('returns false for invalid y values', () => {
    expect(filterInvalidYValues({ y: 'sdfsdf' })).toBe(false);
    expect(filterInvalidYValues({ y: undefined })).toBe(false);
    expect(filterInvalidYValues({ y: false })).toBe(false);
    expect(filterInvalidYValues({ y: null })).toBe(false);
  });
});

describe('getMarkData', () => {
  test('should add size (DEFAULT_MARK_SIZE) to each item in data array', () => {
    expect(getMarkData([{}, {}])).toEqual([
      { size: DEFAULT_MARK_SIZE },
      { size: DEFAULT_MARK_SIZE },
    ]);
  });
});

describe('getDataFromResponse', () => {
  test('gets empty array when no response', () => {
    expect(getDataFromResponse(null)).toEqual([]);
    expect(getDataFromResponse(undefined)).toEqual([]);
  });

  test('gets data from response', () => {
    const response = {
      aggregations: {
        over: {
          buckets: [
            {
              key_as_string: '2018-10-31T18:00:00.000-07:00',
              from_as_string: '2018-10-31T18:00:00.000-07:00',
              key: 1541034000000,
              doc_count: 32,
              metric: { value: 5705.40625 },
            },
            {
              key_as_string: '2018-10-31T19:00:00.000-07:00',
              from_as_string: '2018-10-31T19:00:00.000-07:00',
              key: 1541037600000,
              doc_count: 67,
              metric: { value: 6185.373134328358 },
            },
            {
              key_as_string: '2018-10-31T20:00:00.000-07:00',
              from_as_string: '2018-10-31T20:00:00.000-07:00',
              key: 1541041200000,
              doc_count: 79,
              metric: { value: -2439.9367088607596 },
            },
            {
              key_as_string: '2018-10-31T21:00:00.000-07:00',
              from_as_string: '2018-10-31T21:00:00.000-07:00',
              key: 1541044800000,
              doc_count: 31,
              metric: { value: null },
            },
            {
              key_as_string: '2018-10-31T22:00:00.000-07:00',
              from_as_string: '2018-10-31T22:00:00.000-07:00',
              key: 1541048400000,
              doc_count: 18,
              metric: { value: 4651.5 },
            },
            {
              key_as_string: '2018-10-31T23:00:00.000-07:00',
              from_as_string: '2018-10-31T23:00:00.000-07:00',
              key: 1541052000000,
              doc_count: 3,
              metric: { value: 4410.666666666667 },
            },
          ],
        },
      },
    };
    expect(getDataFromResponse(response, 'metric', MONITOR_TYPE.QUERY_LEVEL)).toEqual([
      {
        x: new Date(response.aggregations.over.buckets[0].from_as_string),
        y: response.aggregations.over.buckets[0].metric.value,
      },
      {
        x: new Date(response.aggregations.over.buckets[1].from_as_string),
        y: response.aggregations.over.buckets[1].metric.value,
      },
      {
        x: new Date(response.aggregations.over.buckets[2].from_as_string),
        y: response.aggregations.over.buckets[2].metric.value,
      },
      {
        x: new Date(response.aggregations.over.buckets[4].from_as_string),
        y: response.aggregations.over.buckets[4].metric.value,
      },
      {
        x: new Date(response.aggregations.over.buckets[5].from_as_string),
        y: response.aggregations.over.buckets[5].metric.value,
      },
    ]);
  });
});

describe('getXYValues', () => {
  test('gets XY values from bucket (when)', () => {
    const whenBucket = {
      key_as_string: '2018-10-31T18:00:00.000-07:00',
      from_as_string: '2018-10-31T18:00:00.000-07:00',
      key: 1541034000000,
      doc_count: 32,
      metric: { value: 5705.40625 },
    };
    expect(getXYValues(whenBucket)).toEqual({
      x: new Date(whenBucket.from_as_string),
      y: whenBucket.metric.value,
    });
  });

  test('gets XY values from bucket (count)', () => {
    const countBucket = {
      key_as_string: '2018-10-31T18:00:00.000-07:00',
      from_as_string: '2018-10-31T18:00:00.000-07:00',
      key: 1541034000000,
      doc_count: 32,
    };
    expect(getXYValues(countBucket)).toEqual({
      x: new Date(countBucket.from_as_string),
      y: countBucket.doc_count,
    });
  });
});
