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

import { get, cloneDeep } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  OpenSearchDashboardsDatatable,
  OpenSearchDashboardsDatatableColumn,
  ExpressionFunctionDefinition,
  ExprVisLayers,
} from '../../../../src/plugins/expressions/public';
import {
  TimeRange,
  calculateBounds,
} from '../../../../src/plugins/data/common';
import { getClient } from '../services';
import { VisLayers, VisLayerTypes, PointInTimeEventsVisLayer } from '../../../../src/plugins/vis_augmenter/public';

type Input = ExprVisLayers;
type Output = Promise<ExprVisLayers>;

interface Arguments {
  detectorId: string;
}

const name = 'overlay_alerts';

export type OverlayAlertsExpressionFunctionDefinition =
  ExpressionFunctionDefinition<'overlay_alerts', Input, Arguments, Output>;

const getAlerts = async (
  monitorId: string,
  startTime: number,
  endTime: number
): Promise<String> => {

  const params = {
    size: 1000,
    sortField: 'start_time',
    sortDirection: 'asc',
    // severityLevel,
    // alertState,
    // monitorIds: [monitorId],
  };

  console.log('getting alerts');

  const resp = await getClient().get( '/api/alerting/alerts', { query: params } );

  if (resp.ok) {
    const { alerts } = resp;

    // added filter for monitor id since there is a bug in the backend for the alerts api
    alerts.filter((alert) => (alert.start_time >= startTime && alert.start_time <= endTime))
      .filter((alert) => (alert.monitorId == monitorId))
    return alerts;
  } else {
    console.log('error getting alerts:', resp);
  }
  return '';
};

const convertAlertsToLayer = (
  alerts: string
): PointInTimeEventsVisLayer => {
  const events = alerts.map((alert) => {
    return {
      timestamp: alert.start_time + (alert.end_time - alert.start_time) / 2,
      metadata: {},
    };
  });
  return {
    originPlugin: 'Alerting',
    events: events,
    pluginResource: 'AlertingPlugin',
    type: VisLayerTypes.PointInTimeEvents
  } as PointInTimeEventsVisLayer;
};

const appendAlertsToTable = (
  datatable: OpenSearchDashboardsDatatable,
  alerts: string
) => {
  const ALERT_COLUMN_ID = 'alert';
  const newDatatable = cloneDeep(datatable);

  // append a new column
  newDatatable.columns = [
    ...newDatatable.columns,
    {
      id: ALERT_COLUMN_ID,
      name: 'Alert',
    } as OpenSearchDashboardsDatatableColumn,
  ];

  // for each anomaly, find the correct time bucket it goes in and add the anomaly value there in the AD column
  // reverse it since the initial results are returned in reverse sequential order
  let rowIndex = 0;
  alerts.reverse().forEach((alert: any) => {
    let found = false;
    while (rowIndex < newDatatable.rows.length - 1 && !found) {
      // assuming the first column in the rows data is the x-axis / timestamp values.
      // probably need to find a better way to guarantee this
      const startTs = newDatatable.rows[rowIndex][
        Object.keys(newDatatable.rows[rowIndex])[0]
        ] as number;
      const endTs = newDatatable.rows[rowIndex + 1][
        Object.keys(newDatatable.rows[rowIndex + 1])[0]
        ] as number;

      if (startTs <= alert.start_time && endTs >= alert.start_time) {
        // adding hacky soln of choosing the first y-series data to overlay anomaly spike
        // this is strictly for making it easier to show correlation of the data w/ the anomaly
        const firstYVal = newDatatable.rows[rowIndex][
          Object.keys(newDatatable.rows[rowIndex])[1]
          ] as number;
        newDatatable.rows[rowIndex] = {
          ...newDatatable.rows[rowIndex],
          [ALERT_COLUMN_ID]: firstYVal,
        };
        found = true;
      } else {
        rowIndex++;
      }
    }
  });
  return newDatatable;
};

const appendAlertDimensionToConfig = (
  visConfig: any,
  datatable: OpenSearchDashboardsDatatable
) => {
  const config = cloneDeep(visConfig);

  // the AD column is appended last. All previous dimensions are incremented sequentially starting from 0.
  // So given 1 x-axis column (accessor=0), 1 y-axis metric column (accessor=1), and 1 y-axis AD column,
  // the accessor should be 2 (column length -1).
  const alertAccessor = datatable.columns.length - 1;

  // TODO: see if this has changed to 'metric' based on new vis schemas
  config.dimensions.y.push({
    accessor: alertAccessor,
    //aggType: 'avg',
    format: {},
    label: 'Alert',
    params: {},
  });

  return config;
};

export const overlayAlertsFunction =
  (): OverlayAlertsExpressionFunctionDefinition => ({
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
      const timeRange = get(
        context,
        'searchContext.timeRange',
        ''
      ) as TimeRange;
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

      // making sure we can actually fetch anomalies. if not just stop here and return.
      // TODO: throw all of this in a try/catch maybe
      if (startTimeInMillis === undefined || endTimeInMillis === undefined) {
        console.log('start or end time invalid');
        return {
          type: 'vis_layers',
          layers: origVisLayers,
        };
      }

      const alerts = await getAlerts(
        monitorId,
        startTimeInMillis,
        endTimeInMillis
      );

      const alertLayer = convertAlertsToLayer(alerts);

      // adding the anomaly layer to the list of VisLayers
      return {
        type: 'vis_layers',
        layers: origVisLayers
          ? origVisLayers.concat(alertLayer)
          : [alertLayer],
      };
    },
  });
