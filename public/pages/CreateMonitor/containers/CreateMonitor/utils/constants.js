/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WHERE_FILTER_ALLOWED_TYPES,
  OPERATORS_MAP,
} from '../../../components/MonitorExpressions/expressions/utils/constants';
import { MONITOR_TYPE } from '../../../../../utils/constants';
import { SUPPORTED_DOC_LEVEL_QUERY_OPERATORS } from '../../../components/DocumentLevelMonitorQueries/utils/constants';

export const BUCKET_COUNT = 5;

export const MATCH_ALL_QUERY = JSON.stringify({ size: 0, query: { match_all: {} } }, null, 4);

export const FORMIK_INITIAL_WHERE_EXPRESSION_VALUES = {
  fieldName: [{ label: '', type: WHERE_FILTER_ALLOWED_TYPES[0] }], // This is an array because the EuiCombobox returns an array of {label: string, type: string} objects.
  operator: OPERATORS_MAP.IS.value,
  fieldValue: '',
  fieldRangeStart: undefined,
  fieldRangeEnd: undefined,
};

/** Sample delegate
 *  {
      order: 1,
      monitor_id: '{{m1}}',
    }
 */
export const DEFAULT_ASSOCIATED_MONITORS_VALUE = {
  sequence: {
    delegates: [],
  },
};

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
  clusterNames: [],
  uri: {
    api_type: '',
    clusters: [],
    path: '',
    path_params: '',
    url: '',
  },
  index: [],
  timeField: '',
  query: MATCH_ALL_QUERY,
  queries: [],
  description: '',
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
  filters: [], // array of FORMIK_INITIAL_WHERE_EXPRESSION_VALUES
  detectorId: '',
  associatedMonitors: DEFAULT_ASSOCIATED_MONITORS_VALUE,
  associatedMonitorsList: [],
  associatedMonitorsEditor: '',
  preventVisualEditor: false,
};

export const FORMIK_INITIAL_AGG_VALUES = {
  aggregationType: 'count',
  fieldName: '',
};

export const FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES = {
  id: undefined,
  queryName: '',
  field: '',
  operator: SUPPORTED_DOC_LEVEL_QUERY_OPERATORS[0],
  query: '',
  tags: [],
};

// TODO DRAFT: Is this an appropriate default to display when defining as an extraction query?
export const DEFAULT_DOCUMENT_LEVEL_QUERY = JSON.stringify(
  {
    description: 'DESCRIPTION_TEXT',
    queries: [
      {
        name: 'QUERY_NAME',
        query: { match_all: {} },
        tags: ['TAG_TEXT'],
      },
    ],
  },
  null,
  4
);

export const DEFAULT_COMPOSITE_AGG_SIZE = 50;

export const METRIC_TOOLTIP_TEXT = 'Extracted statistics such as simple calculations of data.';
export const TIME_RANGE_TOOLTIP_TEXT = 'The time frame of data the plugin should monitor.';
export const FILTERS_TOOLTIP_TEXT =
  'Use a filter to retrieve a subset of the original data source.';
export const GROUP_BY_TOOLTIP_TEXT = 'Specify a field whose every unique value can trigger alerts.';
