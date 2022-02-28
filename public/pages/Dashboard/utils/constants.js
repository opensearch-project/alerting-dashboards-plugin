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
