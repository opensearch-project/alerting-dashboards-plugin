/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  ExpressionFunctionDefinition,
  ExprVisLayers,
} from '../../../../src/plugins/expressions/public';
import { TimeRange, calculateBounds } from '../../../../src/plugins/data/common';
import { VisLayers, VisLayerError, VisLayerErrorTypes } from '../../../../src/plugins/vis_augmenter/public';
import { convertAlertsToLayer, getAlerts, getMonitorName } from './helpers';

type Input = ExprVisLayers;
type Output = Promise<ExprVisLayers>;

interface Arguments {
  monitorId: string;
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
    console.log('args');
    console.log(args);
    const timeRange = get(context, 'searchContext.timeRange', '') as TimeRange;
    const origVisLayers = get(input, 'layers', {
      layers: [] as VisLayers,
    }) as VisLayers;
    const parsedTimeRange = timeRange ? calculateBounds(timeRange) : null;
    const startTimeInMillis = parsedTimeRange?.min?.unix() * 1000 || undefined;
    const endTimeInMillis = parsedTimeRange?.max?.unix() * 1000 || undefined;

    // If time range is invalid return the original vis layers.
    if (startTimeInMillis === undefined || endTimeInMillis === undefined) {
      console.error('Start or end time invalid, so cannot retrieve alerts based on the undefined range');
      return {
        type: 'vis_layers',
        layers: origVisLayers,
      };
    }

    const alerts = await getAlerts(monitorId, startTimeInMillis, endTimeInMillis);
    const monitorName = await getMonitorName(monitorId);
    let error: VisLayerError | undefined;
    if (monitorName === VisLayerErrorTypes.RESOURCE_DELETED)
      error = {
        type: 'RESOURCE_DELETED',
        message: 'The monitor does not exist.'
      }
    else if (monitorName === VisLayerErrorTypes.FETCH_FAILURE)
      error = {
        type: 'FETCH_FAILURE',
        message: 'The user does not have permissions to the monitor.'
      }
    const alertLayer = convertAlertsToLayer(alerts, monitorId, monitorName, error);
    console.log('alertsLayer');
    console.log(alertLayer);

    // adding the alerting layer to the list of VisLayers
    return {
      type: 'vis_layers',
      layers: origVisLayers ? origVisLayers.concat(alertLayer) : [alertLayer],
    };
  },
});
