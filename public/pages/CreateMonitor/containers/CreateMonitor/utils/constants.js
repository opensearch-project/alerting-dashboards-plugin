/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OPERATORS_MAP } from '../../../components/MonitorExpressions/expressions/utils/constants';
import { MONITOR_TYPE } from '../../../../../utils/constants';

export const BUCKET_COUNT = 5;

export const MATCH_ALL_QUERY = JSON.stringify({ size: 0, query: { match_all: {} } }, null, 4);

export const FORMIK_INITIAL_VALUES = {
  /* CONFIGURE MONITOR */
  name: '',
  disabled: false,
  frequency: 'interval',
  timezone: [],
  daily: 0,
  period: { interval: 1, unit: 'MINUTES' },
  weekly: { mon: false, tue: false, wed: false, thur: false, fri: false, sat: false, sun: false },
  monthly: { type: 'day', day: 1 },
  cronExpression: '0 */1 * * *',

  /* DEFINE MONITOR */
  monitor_type: MONITOR_TYPE.QUERY_LEVEL,
  searchType: 'graph',
  index: [],
  timeField: '',
  query: MATCH_ALL_QUERY,
  aggregationType: 'count',
  fieldName: [],
  aggregations: [],
  groupBy: [],
  groupByField: [{ label: '' }],
  overDocuments: 'all documents',
  groupedOverTop: 5,
  groupedOverFieldName: 'bytes',
  bucketValue: 1,
  bucketUnitOfTime: 'h', // m = minute, h = hour, d = day
  where: {
    fieldName: [],
    operator: OPERATORS_MAP.IS,
    fieldValue: '',
    fieldRangeStart: 0,
    fieldRangeEnd: 0,
  },
  detectorId: '',
};

export const FORMIK_INITIAL_AGG_VALUES = {
  aggregationType: 'count',
  fieldName: '',
};

export const DEFAULT_COMPOSITE_AGG_SIZE = 50;

export const METRIC_TOOLTIP_TEXT = 'Extracted statistics such as simple calculations of data.';
export const TIME_RANGE_TOOLTIP_TEXT = 'The time frame of data the plugin should monitor.';
export const FILTERS_TOOLTIP_TEXT =
  'Use a filter to retrieve a subset of the original data source.';
export const GROUP_BY_TOOLTIP_TEXT = 'Specify a field whose every unique value can trigger alerts.';
