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

import { EMPTY_ALERT_LIST } from './constants';

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
  //Compare start time and last updated time
  return alertList;
}
