/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const EMPTY_ALERT_LIST = {
  ACTIVE: 0,
  ACKNOWLEDGED: 0,
  ERROR: 0,
  total: 0,
  alerts: [],
};

export const MAX_ALERT_COUNT = 10000;

export const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
export const DEFAULT_GET_ALERTS_QUERY_PARAMS = {
  alertState: 'ALL',
  from: 0,
  search: '',
  severityLevel: 'ALL',
  size: 20,
  sortDirection: 'desc',
  sortField: 'start_time',
};

export const DEFAULT_GET_ALERTS_QUERY_PARAMS_BY_TRIGGER = {
  alertState: 'ALL',
  from: 0,
  search: '',
  severityLevel: 'ALL',
  size: MAX_ALERT_COUNT,
  sortDirection: 'desc',
  sortField: 'start_time',
};

export const PPL_SEARCH_PATH = '_plugins/_ppl';
export const DEFAULT_LOG_PATTERN_TOP_N = 3;
export const DEFAULT_LOG_PATTERN_SAMPLE_SIZE = 20;
export const DEFAULT_ACTIVE_ALERTS_AI_TOP_N = 1;
export const DEFAULT_DSL_QUERY_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ';
export const DEFAULT_PPL_QUERY_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const PERIOD_END_PLACEHOLDER = '{{period_end}}';
export const BUCKET_UNIT_PPL_UNIT_MAP = {
  'd': 'DAY',
  'h': 'HOUR',
  'm': 'MINUTE',
}
