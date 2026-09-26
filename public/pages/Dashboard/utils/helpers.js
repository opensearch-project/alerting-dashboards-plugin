/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import moment from 'moment';
import {
  DEFAULT_GET_ALERTS_QUERY_PARAMS,
  EMPTY_ALERT_LIST,
  MAX_ALERT_COUNT,
  PERIOD_PLACEHOLDER_REGEX,
} from './constants';
import { bucketColumns } from './tableUtils';
import { ALERT_STATE, DEFAULT_EMPTY_DATA } from '../../../utils/constants';
import queryString from 'query-string';
import { GET_ALERTS_SORT_FILTERS } from '../../../../server/services/AlertService';

export function groupAlertsByTrigger(alerts) {
  if (_.isUndefined(alerts)) return _.cloneDeep(EMPTY_ALERT_LIST.alerts);
  let alertsByTriggers = new Map();
  alerts.map((alert) => {
    const triggerID = alert.trigger_id;
    const newAlertList = alertsByTriggers.has(triggerID)
      ? addAlert(alertsByTriggers.get(triggerID), alert)
      : addFirstAlert(alert);
    alertsByTriggers.set(triggerID, newAlertList);
  });
  return Array.from(alertsByTriggers, ([triggerID, alerts]) => ({ ...alerts, triggerID }));
}

export function addFirstAlert(firstAlert) {
  const {
    state,
    version,
    trigger_name,
    severity,
    start_time,
    last_notification_time,
    monitor_name,
    monitor_id,
    workflow_id,
    workflow_name,
    alert_source,
  } = firstAlert;
  let newAlertList = _.cloneDeep(EMPTY_ALERT_LIST);
  newAlertList[state]++;
  newAlertList.total++;
  newAlertList.alerts.push(firstAlert);
  return {
    ...newAlertList,
    version,
    trigger_name,
    severity,
    start_time,
    last_notification_time,
    monitor_name: monitor_name || workflow_name,
    monitor_id: monitor_id || workflow_id,
    alert_source,
  };
}

export function addAlert(alertList, newAlert) {
  const state = newAlert.state;
  alertList[state]++;
  alertList.total++;
  alertList.alerts.push(newAlert);

  const { end_time, acknowledged_time } = newAlert;
  const alertLastUpdateTime = end_time < acknowledged_time ? acknowledged_time : end_time;
  if (alertList.last_notification_time < alertLastUpdateTime)
    alertList.last_notification_time = alertLastUpdateTime;

  return alertList;
}

export const renderEmptyValue = (value) => {
  return value === undefined ? DEFAULT_EMPTY_DATA : value;
};

export function insertGroupByColumn(groupBy = []) {
  let result = _.cloneDeep(bucketColumns);
  groupBy.map((fieldName) =>
    result.push({
      field: `agg_alert_content.bucket.key.${fieldName}`,
      name: _.capitalize(fieldName),
      render: renderEmptyValue,
      sortable: false,
      truncateText: false,
    })
  );
  return result;
}

export function removeColumns(columnFieldNames = [], allColumns = []) {
  return allColumns.filter((column) => !_.includes(columnFieldNames, column.field));
}

export function getInitialSize(
  perAlertView = false,
  defaultSize = DEFAULT_GET_ALERTS_QUERY_PARAMS.size
) {
  return perAlertView && defaultSize >= 0 ? defaultSize : MAX_ALERT_COUNT;
}

export function displayAcknowledgedAlertsToast(notifications, successfulCount = 0) {
  const successfulText = `Successfully acknowledged ${successfulCount} ${
    successfulCount === 1 ? 'alert' : 'alerts'
  }.`;
  if (successfulCount > 0) notifications.toasts.addSuccess(successfulText);
}

export function filterActiveAlerts(alerts = []) {
  return _.filter(alerts, { state: ALERT_STATE.ACTIVE });
}

export function getQueryObjectFromState({
  page,
  size,
  search,
  sortField,
  sortDirection,
  severityLevel,
  alertState,
  monitorIds,
  flyoutIsOpen,
}) {
  return {
    page,
    size,
    search,
    sortField,
    sortDirection,
    severityLevel,
    alertState,
    monitorIds,
    flyoutIsOpen,
  };
}

export function getURLQueryParams(location) {
  const {
    from = DEFAULT_GET_ALERTS_QUERY_PARAMS.from,
    size = DEFAULT_GET_ALERTS_QUERY_PARAMS.size,
    search = DEFAULT_GET_ALERTS_QUERY_PARAMS.search,
    sortField = DEFAULT_GET_ALERTS_QUERY_PARAMS.sortField,
    sortDirection = DEFAULT_GET_ALERTS_QUERY_PARAMS.sortDirection,
    severityLevel = DEFAULT_GET_ALERTS_QUERY_PARAMS.severityLevel,
    alertState = DEFAULT_GET_ALERTS_QUERY_PARAMS.alertState,
  } = queryString.parse(location.search);

  return {
    from: isNaN(parseInt(from, 10)) ? DEFAULT_GET_ALERTS_QUERY_PARAMS.from : parseInt(from, 10),
    size: isNaN(parseInt(size, 10)) ? DEFAULT_GET_ALERTS_QUERY_PARAMS.size : parseInt(size, 10),
    search,
    sortField: _.includes(_.values(GET_ALERTS_SORT_FILTERS), sortField)
      ? sortField
      : DEFAULT_GET_ALERTS_QUERY_PARAMS.sortField,
    sortDirection,
    severityLevel,
    alertState,
  };
}

export function findLongestStringField(pplRes) {
  if (!pplRes || !pplRes.body || !Array.isArray(pplRes.body.schema) || !Array.isArray(pplRes.body.datarows)) {
    return '';
  }

  const { schema, datarows } = pplRes.body;

  if (schema.length === 0 || datarows.length === 0) return '';

  let longestField = '';
  let maxLength = 0;

  // Iterate over schema and find the longest length string field name
  schema.forEach((field, index) => {
    if (field.type === 'string') {
      const fieldValue = datarows[0][index];
      if (fieldValue) {
        const fieldLength = fieldValue.length;
        if (fieldLength > maxLength) {
          maxLength = fieldLength;
          longestField = field.name;
        }
      }
    }
  });

  return longestField;
}

export async function searchQuery(httpClient, path, method, dataSourceQuery, query) {
  return await httpClient.post(`/api/console/proxy`, {
    query: {
      path: path,
      method: method,
      dataSourceId: dataSourceQuery ? dataSourceQuery.query.dataSourceId : '',
    },
    body: query,
    prependBasePath: true,
    asResponse: true,
    withLongNumeralsSupport: true,
  });
}

// Units accepted by the backend IntervalSchedule
const PERIOD_UNIT_MOMENT_UNIT_MAP = {
  SECONDS: 'seconds',
  MINUTES: 'minutes',
  HOURS: 'hours',
  DAYS: 'days',
};

/**
 * Mirrors the backend's IntervalSchedule.getPeriodEndingAt, which resolves {{period_start}}
 * to periodEnd minus one interval. Cron schedules resolve it to the previous cron fire time,
 * which cannot be computed here without a cron parser, so null is returned for them.
 */
export function getPeriodStart(schedule, periodEnd) {
  const interval = _.get(schedule, 'period.interval');
  const unit = _.get(schedule, 'period.unit');
  const momentUnit = PERIOD_UNIT_MOMENT_UNIT_MAP[unit];
  if (!interval || !momentUnit || !Number.isFinite(periodEnd)) return null;
  return moment.utc(periodEnd).subtract(interval, momentUnit).valueOf();
}

// Bounds of a range query, which parses them with the `format` of the same object
const RANGE_BOUND_KEYS = ['from', 'to', 'gt', 'gte', 'lt', 'lte'];

/**
 * Replaces {{period_start}} and {{period_end}} in every string value of a monitor query without
 * touching its structure; object keys are field or aggregation names and are not rewritten.
 * values maps each param to its replacement, or to null when it cannot be resolved; unresolved
 * placeholders are left in place and reported through `unresolved`. With dropFormat, `format` is
 * removed from a range whose bounds were replaced, because the replacement (e.g. an ISO date
 * instead of epoch millis) no longer matches it. Other formats, such as a date_histogram format
 * that also parses its extended_bounds, are kept.
 */
export function resolvePeriodPlaceholders(source, values, { dropFormat = false } = {}) {
  let unresolved = false;
  const replaceIn = (text) =>
    text.replace(PERIOD_PLACEHOLDER_REGEX, (tag, tripleBraceParam, param) => {
      const value = values[tripleBraceParam || param];
      if (value === null || value === undefined) {
        unresolved = true;
        return tag;
      }
      return String(value);
    });
  const walk = (node) => {
    if (typeof node === 'string') return replaceIn(node);
    if (Array.isArray(node)) return node.map(walk);
    if (!_.isPlainObject(node)) return node;
    let hasReplacedBound = false;
    const result = _.mapValues(node, (child, key) => {
      const resolved = walk(child);
      if (RANGE_BOUND_KEYS.includes(key) && resolved !== child) hasReplacedBound = true;
      return resolved;
    });
    if (dropFormat && hasReplacedBound) delete result.format;
    return result;
  };
  const result = walk(source);
  return { result, unresolved };
}
