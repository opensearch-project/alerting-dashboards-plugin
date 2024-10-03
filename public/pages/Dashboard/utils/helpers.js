/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { DEFAULT_GET_ALERTS_QUERY_PARAMS, EMPTY_ALERT_LIST, MAX_ALERT_COUNT } from './constants';
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
  const { schema, datarows } = pplRes.body;

  if (!datarows || datarows.length === 0) return '';

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