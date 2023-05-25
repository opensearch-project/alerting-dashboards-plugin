/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { get } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  ExpressionFunctionDefinition,
  ExprVisLayers,
} from '../../../../src/plugins/expressions/public';
import { TimeRange, calculateBounds } from '../../../../src/plugins/data/common';
import { getClient } from '../services';
import {
  VisLayers,
  VisLayerTypes,
  VisLayerError,
  PointInTimeEventsVisLayer,
} from '../../../../src/plugins/vis_augmenter/public';

type Input = ExprVisLayers;
type Output = Promise<ExprVisLayers>;

interface Arguments {
  detectorId: string;
}

const name = 'overlay_alerts';

export type OverlayAlertsExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'overlay_alerts',
  Input,
  Arguments,
  Output
>;

const getAlerts = async (
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
    const { alerts } = resp;

    // added filter for monitor id since there is a bug in the backend for the alerts api
    alerts
      .filter((alert) => alert.start_time >= startTime && alert.start_time <= endTime)
      .filter((alert) => alert.monitorId == monitorId);
    return alerts;
  } else {
    console.log('error getting alerts:', resp);
  }
  return '';
};

const getMonitorName = async (monitorId: string): Promise<string> => {
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

const convertAlertsToLayer = (
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

export const overlayAlertsFunction = (): OverlayAlertsExpressionFunctionDefinition => ({
  name,
  type: 'vis_layers',
  inputTypes: ['vis_layers'],
  help: i18n.translate('data.functions.overlay_alerts.help', {
    defaultMessage: 'Add an alert vis layer',
  }),
  args: {
    monitorId: {
      types: ['string'],
      default: '""',
      help: '',
    },
  },

  async fn(input, args, context): Promise<ExprVisLayers> {
    // Parsing all of the args & input
    const monitorId = get(args, 'monitorId', '');
    const timeRange = get(context, 'searchContext.timeRange', '') as TimeRange;
    const origVisLayers = get(input, 'layers', {
      layers: [] as VisLayers,
    }) as VisLayers;
    const parsedTimeRange = timeRange ? calculateBounds(timeRange) : null;
    const startTimeInMillis = parsedTimeRange?.min?.unix()
      ? parsedTimeRange?.min?.unix() * 1000
      : undefined;
    const endTimeInMillis = parsedTimeRange?.max?.unix()
      ? parsedTimeRange?.max?.unix() * 1000
      : undefined;

    // If time range is invalid return the original vis layers.
    if (startTimeInMillis === undefined || endTimeInMillis === undefined) {
      console.log('start or end time invalid');
      return {
        type: 'vis_layers',
        layers: origVisLayers,
      };
    }

    const alerts = await getAlerts(monitorId, startTimeInMillis, endTimeInMillis);
    let alertLayer;
    const monitorName = await getMonitorName(monitorId);
    if (monitorName === 'RESOURCE_DELETED') {
      const error = {
        type: 'RESOURCE_DELETED',
        message: 'The monitor does not exist.'
      }
      alertLayer = convertAlertsToLayer(alerts, monitorId, monitorName, error);
    } else if (monitorName === 'FETCH_FAILURE') {
      const error = {
        type: 'FETCH_FAILURE',
        message: 'The user does not have permissions to the monitor.'
      }
      alertLayer = convertAlertsToLayer(alerts, monitorId, monitorName, error);
    } else {
      alertLayer = convertAlertsToLayer(alerts, monitorId, monitorName);
    }

    // adding the alerting layer to the list of VisLayers
    return {
      type: 'vis_layers',
      layers: origVisLayers ? origVisLayers.concat(alertLayer) : [alertLayer],
    };
  },
});
