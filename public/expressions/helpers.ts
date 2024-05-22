/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getClient } from '../services';
import {
  VisLayerTypes,
  VisLayerError,
  VisLayerErrorTypes,
  PointInTimeEventsVisLayer,
} from '../../../../src/plugins/vis_augmenter/public';
import { Alert } from '../models/interfaces';
import { getDataSourceId, getDataSourceQueryObj } from '../pages/utils/helpers';

export const getAlerts = async (
  monitorId: string,
  startTime: number,
  endTime: number
): Promise<Alert[]> => {
  const params = {
    size: 1000,
    sortField: 'start_time',
    sortDirection: 'asc',
    monitorIds: [monitorId],
  };

  const dataSourceId = getDataSourceId();
  const extendedParams = {
    ...(dataSourceId !== undefined && { dataSourceId }),
    ...params // Other parameters
  };
  const resp = await getClient().get('/api/alerting/alerts', { query: extendedParams });

  if (resp.ok) {
    const filteredAlerts = resp.alerts.filter(
      (alert) => alert.start_time >= startTime && alert.start_time <= endTime
    );
    return filteredAlerts;
  } else {
    console.error('Error getting alerts to overlay:', resp);
  }
  return [];
};

export const getMonitorName = async (monitorId: string, dataSourceEnabled?: boolean): Promise<string> => {
  const dataSourceQuery = getDataSourceQueryObj();
  const resp = await getClient().get(`/api/alerting/monitors/${monitorId}`, dataSourceQuery);
  if (resp.ok) {
    return resp.resp.name;
  } else if (resp.resp === '[alerting_exception] Monitor not found.') {
    return VisLayerErrorTypes.RESOURCE_DELETED
  } else if (
    resp.resp.includes('Do not have permissions to resource') ||
    resp.resp.includes('security_exception')
  ) {
    return VisLayerErrorTypes.FETCH_FAILURE
  }
  return 'error loading monitor';
};

export const convertAlertsToLayer = (
  alerts: Alert[],
  monitorId: string,
  monitorName: string,
  error?: VisLayerError,
): PointInTimeEventsVisLayer => {
  const events = alerts.map((alert) => {
    return {
      timestamp: alert.start_time,
      metadata: {
        pluginResourceId: monitorId,
      },
    };
  });
  return {
    originPlugin: 'alertingDashboards',
    events,
    pluginResource: {
      type: 'Alerting Monitors',
      id: monitorId,
      name: monitorName,
      urlPath: `alerting#/monitors/${monitorId}`,
    },
    pluginEventType: 'Alerts',
    type: VisLayerTypes.PointInTimeEvents,
    error,
  };
};
