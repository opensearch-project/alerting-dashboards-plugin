/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import VisualGraph from './VisualGraph';
import { FORMIK_INITIAL_VALUES } from '../../containers/CreateMonitor/utils/constants';
import { MONITOR_TYPE } from '../../../../utils/constants';

const queryGraphResponse = {
  _shards: { total: 1, failed: 0, successful: 1, skipped: 0 },
  hits: { hits: [], total: { value: 28, relation: 'eq' }, max_score: null },
  took: 5,
  timed_out: false,
  aggregations: {
    over: {
      buckets: [
        { key_as_string: '2021-11-19T07:00:00.000-08:00', doc_count: 0, key: 1637334000000 },
        { key_as_string: '2021-11-19T08:00:00.000-08:00', doc_count: 6, key: 1637337600000 },
        { key_as_string: '2021-11-19T09:00:00.000-08:00', doc_count: 5, key: 1637341200000 },
        { key_as_string: '2021-11-19T10:00:00.000-08:00', doc_count: 4, key: 1637344800000 },
        { key_as_string: '2021-11-19T11:00:00.000-08:00', doc_count: 8, key: 1637348400000 },
        { key_as_string: '2021-11-19T12:00:00.000-08:00', doc_count: 5, key: 1637352000000 },
      ],
    },
  },
};
const bucketMonitorValues = {
  name: '',
  disabled: false,
  frequency: 'interval',
  timezone: [],
  daily: 0,
  period: { interval: 1, unit: 'MINUTES' },
  weekly: { mon: false, tue: false, wed: false, thur: false, fri: false, sat: false, sun: false },
  monthly: { type: 'day', day: 1 },
  cronExpression: '0 */1 * * *',
  monitor_type: 'bucket_level_monitor',
  searchType: 'graph',
  index: [
    { label: 'opensearch_dashboards_sample_data_ecommerce', health: 'green', status: 'open' },
  ],
  timeField: 'order_date',
  query: '{\n    "size": 0,\n    "query": {\n        "match_all": {}\n    }\n}',
  aggregationType: 'count',
  fieldName: [],
  aggregations: [],
  groupBy: ['customer_gender'],
  groupByField: [{ label: '' }],
  overDocuments: 'all documents',
  groupedOverTop: 5,
  groupedOverFieldName: 'bytes',
  bucketValue: 1,
  bucketUnitOfTime: 'h',
  where: { fieldName: [], operator: 'is', fieldValue: '', fieldRangeStart: 0, fieldRangeEnd: 0 },
  detectorId: '',
  triggerDefinitions: [],
};

const bucketGraphResponse = {
  _shards: { total: 1, failed: 0, successful: 1, skipped: 0 },
  hits: { hits: [], total: { value: 28, relation: 'eq' }, max_score: null },
  took: 19,
  timed_out: false,
  aggregations: {
    composite_agg: {
      buckets: [
        { doc_count: 6, key: { date: 1637337600000 } },
        { doc_count: 5, key: { date: 1637341200000 } },
        { doc_count: 4, key: { date: 1637344800000 } },
        { doc_count: 8, key: { date: 1637348400000 } },
        { doc_count: 5, key: { date: 1637352000000 } },
      ],
      after_key: { date: 1637352000000 },
    },
  },
};

describe('VisualGraph', () => {
  test('renders', () => {
    const component = (
      <VisualGraph
        values={FORMIK_INITIAL_VALUES}
        fieldName="doc_count"
        response={queryGraphResponse}
      />
    );
    expect(render(component)).toMatchSnapshot();
  });

  test('renders with bucket level monitor', () => {
    const values = FORMIK_INITIAL_VALUES;
    values.monitor_type = MONITOR_TYPE.BUCKET_LEVEL;
    const component = (
      <VisualGraph
        values={bucketMonitorValues}
        fieldName="doc_count"
        response={bucketGraphResponse}
      />
    );
    expect(render(component)).toMatchSnapshot();
  });
});
