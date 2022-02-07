/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
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
  uri: {
    api_type: '',
    path: '',
    path_params: '',
    url: '',
  },
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
