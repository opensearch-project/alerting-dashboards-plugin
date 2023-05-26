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
import { VisLayers } from '../../../../src/plugins/vis_augmenter/public';
import { convertAlertsToLayer, getAlerts, getMonitorName } from './helpers';

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
