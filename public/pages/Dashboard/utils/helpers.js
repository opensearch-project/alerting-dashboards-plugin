/*
 *   Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import _ from 'lodash';
import { EMPTY_ALERT_LIST } from './constants';
import { bucketColumns } from './tableUtils';

export function groupAlertsByTrigger(alerts) {
  let alertsByTriggers = new Map();
  alerts.map((alert) => {
    const triggerID = alert.trigger_id;
    // const prevAlertList = alertsByTriggers.has(triggerID) ? alertsByTriggers.get(triggerID) : EMPTY_ALERT_LIST;
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
  //Compare start time and last updated time
  return alertList;
}

export function insertGroupByColumn(groupBy) {
  let result = _.cloneDeep(bucketColumns);
  groupBy.map((fieldName) =>
    result.splice(0, 0, {
      field: `agg_alert_content.bucket.key.${fieldName}`,
      name: fieldName,
      sortable: false,
      truncateText: false,
    })
  );
  return result;
}
