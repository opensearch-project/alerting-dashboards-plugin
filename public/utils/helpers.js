/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiTitle } from '@elastic/eui';
import { htmlIdGenerator } from '@elastic/eui/lib/services';
import {
  displayAcknowledgedAlertsToast,
  filterActiveAlerts,
} from '../pages/Dashboard/utils/helpers';
import _ from 'lodash';

export const makeId = htmlIdGenerator();

// A helper function that wraps an event handler and filters out ESCAPE keys
export const ignoreEscape = (eventHandler) => (event) => {
  if (!(event.keyCode === 27)) {
    eventHandler();
  }
};

// A helper function that shows toast messages for backend errors.
export const backendErrorNotification = (notifications, actionName, objectName, errorMessage) => {
  notifications.toasts.addDanger({
    title: `Failed to ${actionName} the ${objectName}`,
    text: errorMessage,
    toastLifeTimeMs: 20000, // the default lifetime for toasts is 10 sec
  });
};

// A helper function to generate a simple string explaining how many elements a user can add to a list.
export const inputLimitText = (
  currCount = 0,
  limit = 0,
  singularKeyword = '',
  pluralKeyword = '',
  styleProps = {}
) => {
  const difference = limit - currCount;
  const remainingLimit = `You can add up to ${difference} ${limit === 1 ? '' : 'more'} ${
    difference === 1 ? singularKeyword : pluralKeyword
  }.`;
  const reachedLimit = `You have reached the limit of ${limit} ${
    limit === 1 ? singularKeyword : pluralKeyword
  }.`;
  return (
    <EuiText color={'subdued'} size={'m'} style={styleProps}>
      {difference > 0 ? remainingLimit : reachedLimit}
    </EuiText>
  );
};

export async function deleteMonitor(monitor, httpClient, notifications) {
  const { id, version } = monitor;
  const poolType = monitor.item_type === 'composite' ? 'workflows' : 'monitors';
  return httpClient
    .delete(`../api/alerting/${poolType}/${id}`, { query: { version } })
    .then((resp) => {
      if (!resp.ok) {
        backendErrorNotification(notifications, 'delete', 'monitor', resp.resp);
      } else {
        notifications.toasts.addSuccess(`Monitor deleted successfully.`);
      }
      return resp;
    })
    .catch((err) => err);
}

export const getDigitId = (length = 6) =>
  Math.floor(Date.now() * Math.random())
    .toString()
    .slice(-length);

// Assumes that values is an array of objects with "name" inside
export const getUniqueName = (values, prefix) => {
  const lastValue = _.last(values);
  const lastName = lastValue ? lastValue.name : '';
  const lastDigit = Number.parseInt(lastName.match(/\d+$/)?.[0] || 0, 10);

  // Checks if value is already in use
  const getUniqueName = (digit) => {
    const name = `${prefix}${digit + 1}`;
    const duplicate = values.find((value) => value.name === name);
    return duplicate ? getUniqueName(digit + 1) : name;
  };

  return getUniqueName(lastDigit);
};

export async function acknowledgeAlerts(httpClient, notifications, alerts) {
  const selectedAlerts = filterActiveAlerts(alerts);

  const monitorAlerts = selectedAlerts.reduce((monitorAlerts, alert) => {
    const id = alert.id;
    const monitorId = alert.workflow_id || alert.monitor_id;
    if (monitorAlerts[monitorId]) monitorAlerts[monitorId].alerts.push(id);
    else
      monitorAlerts[monitorId] = {
        alerts: [id],
        poolType: !!alert.workflow_id ? 'workflows' : 'monitors',
      };
    return monitorAlerts;
  }, {});

  const acknowledgePromises = Object.entries(monitorAlerts).map(
    ([monitorId, { alerts, poolType }]) =>
      httpClient
        .post(`../api/alerting/${poolType}/${monitorId}/_acknowledge/alerts`, {
          body: JSON.stringify({ alerts }),
        })
        .then((resp) => {
          if (!resp.ok) {
            backendErrorNotification(notifications, 'acknowledge', 'alert', resp.resp);
          } else {
            const successfulCount = _.get(resp, 'resp.success', []).length;
            displayAcknowledgedAlertsToast(notifications, successfulCount);
          }
        })
        .catch((error) => error)
  );

  return acknowledgePromises;
}

export const titleTemplate = (title, subTitle) => (
  <>
    <EuiTitle size="xs">
      <h4>{title}</h4>
    </EuiTitle>
    {subTitle && (
      <EuiText color={'subdued'} size={'xs'}>
        <p>{subTitle}</p>
      </EuiText>
    )}
  </>
);
