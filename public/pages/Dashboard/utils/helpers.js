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

import _ from 'lodash';
import { EMPTY_ALERT_LIST, MAX_ALERT_COUNT } from './constants';
import { bucketColumns } from './tableUtils';
import { DEFAULT_NUM_FLYOUT_ROWS } from '../../../components/Flyout/flyouts/alertsDashboard';
import { DEFAULT_EMPTY_DATA } from '../../../utils/constants';

export function groupAlertsByTrigger(alerts) {
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
    monitor_name,
    monitor_id,
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

export function insertGroupByColumn(groupBy) {
  let result = _.cloneDeep(bucketColumns);
  groupBy.map((fieldName) =>
    result.splice(0, 0, {
      field: `agg_alert_content.bucket.key.${fieldName}`,
      name: fieldName,
      render: renderEmptyValue,
      sortable: false,
      truncateText: false,
    })
  );
  return result;
}

export function removeColumns(columnFieldNames = [], allColumns) {
  return allColumns.filter((column) => {
    return !_.includes(columnFieldNames, column.field);
  });
}

export function getInitialSize(isAlertsFlyout, perAlertView, defaultSize) {
  if (!perAlertView) return MAX_ALERT_COUNT;
  if (isAlertsFlyout) return DEFAULT_NUM_FLYOUT_ROWS;
  return defaultSize;
}
