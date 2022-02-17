/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const TIME_SERIES_ALERT_STATE = Object.freeze({
  NO_ALERTS: 'NO_ALERTS',
  TRIGGERED: 'TRIGGERED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  ERROR: 'ERROR',
});

export const ALERT_TIMELINE_COLORS_MAP = {
  [TIME_SERIES_ALERT_STATE.NO_ALERTS]: '#6AAF35',
  [TIME_SERIES_ALERT_STATE.TRIGGERED]: '#D0021B',
  [TIME_SERIES_ALERT_STATE.ACKNOWLEDGED]: 'pink',
  [TIME_SERIES_ALERT_STATE.ERROR]: 'lightgrey',
};

// Maximum days allowed for date range
export const MAX_DAYS_ALLOWED_IN_RANGE = 30;

// Default time window for Range
export const DEFAULT_POI_TIME_WINDOW_DAYS = 2;

export const MAX_DOC_COUNT_FOR_ALERTS = 800;

//Minimum Highlight Window if range is too small.
export const MIN_POI_Y_SCALE = 5;

// This is in Minutes
export const MIN_HIGHLIGHT_WINDOW_DURATION = 10;

export const EMPTY_ALERT_COUNT = {
  [TIME_SERIES_ALERT_STATE.TRIGGERED]: 0,
  [TIME_SERIES_ALERT_STATE.ACKNOWLEDGED]: 0,
  [TIME_SERIES_ALERT_STATE.ERROR]: 0,
};
