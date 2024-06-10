/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getDataSourceEnabled, getDataSource } from '../../services/services';
import _ from 'lodash';
import { ShowAlertComments } from '../../components/Comments/ShowAlertComments';
import { COMMENTS_ENABLED_SETTING } from './constants';

export function dataSourceEnabled() {
  return getDataSourceEnabled()?.enabled;
}

export function getDataSourceQueryObj() {
  const dataSourceQuery = dataSourceEnabled()
    ? { dataSourceId: getDataSource()?.dataSourceId }
    : undefined;
  return dataSourceQuery ? { query: dataSourceQuery } : undefined;
}

export function getDataSourceId() {
  const dataSourceId = dataSourceEnabled() ? getDataSource()?.dataSourceId : undefined;
  return dataSourceId;
}

export function isDataSourceChanged(prevProps, currProps) {
  return (
    dataSourceEnabled() && !_.isEqual(prevProps.landingDataSourceId, currProps.landingDataSourceId)
  );
}

export function getURL(url, dataSourceId) {
  return dataSourceEnabled() ? `${url}&dataSourceId=${dataSourceId}` : url;
}

export function parseQueryStringAndGetDataSource(queryString) {
  const params = {};
  const queryParams = queryString.substring(1).split('&');
  for (const param of queryParams) {
    const pair = param.split('=');
    params[pair[0]] = pair[1];
  }
  return params['dataSourceId'];
}

export function constructUrlFromDataSource(url) {
  return dataSourceEnabled() ? `${url}&dataSourceId=${getDataSource()?.dataSourceId}` : url;
}

export const appendCommentsAction = (columns, httpClient) => {
  const actionsColumn = columns.find(({ name }) => name === 'Actions');
  const showCommentsAction = {
    render: (alert) => <ShowAlertComments alert={alert} httpClient={httpClient} />,
  };

  if (actionsColumn) {
    actionsColumn.actions.push(showCommentsAction);
  } else {
    columns.push({
      name: 'Actions',
      sortable: false,
      actions: [showCommentsAction],
    });
  }

  return columns;
};

export async function getIsCommentsEnabled(httpClient) {
  let alertCommentsEnabled = false;

  try {
    const dataSourceQuery = getDataSourceQueryObj();
    const response = await httpClient.get('../api/alerting/_settings', dataSourceQuery);
    if (response.ok) {
      const { defaults, transient, persistent } = response.resp;
      alertCommentsEnabled = _.get(
        // If present, take the 'transient' setting.
        transient,
        COMMENTS_ENABLED_SETTING,
        // Else take the 'persistent' setting.
        _.get(
          persistent,
          COMMENTS_ENABLED_SETTING,
          // Else take the 'default' setting.
          _.get(defaults, COMMENTS_ENABLED_SETTING, false)
        )
      );

      // Boolean settings can be returned as strings (e.g., `"true"`, and `"false"`). Constructing boolean value from the string.
      if (typeof alertCommentsEnabled === 'string') {
        alertCommentsEnabled = JSON.parse(alertCommentsEnabled);
      }
    }
  } catch (e) {
    console.log('Error while retrieving settings:', e);
  }

  return alertCommentsEnabled;
}
