/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getClient } from '../services';
import {
  VisLayerTypes,
  VisLayerError,
  PointInTimeEventsVisLayer,
} from '../../../../src/plugins/vis_augmenter/public';

export const getAlerts = async (
  monitorId: string,
  startTime: number,
  endTime: number
): Promise<string> => {
  const params = {
    size: 1000,
    sortField: 'start_time',
    sortDirection: 'asc',
    monitorIds: [monitorId],
  };

  const resp = await getClient().get('/api/alerting/alerts', { query: params });

  if (resp.ok) {
    // added filter for monitor id since there is a bug in the backend for the alerts api
    const filteredAlerts = resp.alerts.filter((alert) => alert.start_time >= startTime && alert.start_time <= endTime );
    return filteredAlerts;
  } else {
    console.log('error getting alerts:', resp);
  }
  return '';
};

export const getMonitorName = async (monitorId: string): Promise<string> => {
  const resp = await getClient().get('/api/alerting/monitors/' + monitorId);
  if (resp.ok) {
    return resp.resp.name as string;
  } else if (resp.resp === '[alerting_exception] Monitor not found.') {
    return 'RESOURCE_DELETED'
  } else if (resp.resp.includes('Do not have permissions to resource') || resp.resp.includes('security_exception')) {
    return 'FETCH_FAILURE'
  }
  return 'error loading monitor';
};

export const convertAlertsToLayer = (
  alerts: string,
  monitorId: string,
  monitorName: string,
  error?: VisLayerError,
): PointInTimeEventsVisLayer => {
  const events = alerts.map((alert) => {
    return {
      timestamp: alert.start_time + (alert.end_time - alert.start_time) / 2,
      metadata: {
        pluginResourceId: monitorId,
      },
    };
  });
  return {
    originPlugin: 'Alerting',
    events,
    pluginResource: {
      type: 'Alerting Monitors',
      id: monitorId,
      name: monitorName,
      urlPath: 'alerting#/monitors/' + monitorId,
    },
    type: VisLayerTypes.PointInTimeEvents,
    error: error
  } as PointInTimeEventsVisLayer;
};
