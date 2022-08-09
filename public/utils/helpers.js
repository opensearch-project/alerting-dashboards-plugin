/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText } from '@elastic/eui';
import { htmlIdGenerator } from '@elastic/eui/lib/services';
import queryString from 'query-string';

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
    <EuiText color={'subdued'} size={'xs'} style={styleProps}>
      {difference > 0 ? remainingLimit : reachedLimit}
    </EuiText>
  );
};

/**
 * A helper function that makes calls to getAlerts API to retrieve alerts for monitors associated with cluster
 * @param { Object } params parameters used to retrieve an alert response. The values that go into
 * { params } object are from, size, search, sortField, sortDirection, severityLevel, alertState,
 * and monitorID.
 * @param { Object } httpClient httpClient can submit REST requests to the API
 * @param { Object } notifications -  a global object from CoreContext.js, allows us to display toast
 * notifications in the bottom right of the screen.
 * @param { Object } location - information about the search query from the current URL.
 * Includes 3 key-value pairings that map to Strings. The keys are "pathname", "search", and
 * "hash".
 * @param { Object } history -  the current location object in it.
 * Includes 3 key-value pairings, where all keys are Strings. They key "length" is mapped to an integer,
 * the key "action" is mapped to a String, and the key "location" is mapped to the location object.
 * @returns { Object } returns Object of { alerts, totalAlerts }
 * where alerts is an array of alerts objects and totalAlerts is a number >=0, otherwise log errors
 */
export async function getAlerts({ params, httpClient, notifications, location, history }) {
  const queryParamsString = queryString.stringify(params);
  history.replace({ ...location, search: queryParamsString });

  try {
    const resp = await httpClient.get('../api/alerting/alerts', { query: params });
    if (resp.ok) {
      return { alerts: resp.alerts, totalAlerts: resp.totalAlerts };
    } else {
      console.log('Error getting alerts:', resp);
      backendErrorNotification(notifications, 'get', 'alerts', resp.err);
    }
  } catch (e) {
    console.log('Error getting alerts:', e);
    backendErrorNotification(notifications, 'get,', 'alerts', e);
  }
}
