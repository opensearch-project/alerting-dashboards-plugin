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

/*
 *   Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React from 'react';
import _ from 'lodash';
import { EuiIcon, EuiLink } from '@elastic/eui';
import moment from 'moment-timezone';
import getScheduleFromMonitor from './getScheduleFromMonitor';
import {
  DEFAULT_EMPTY_DATA,
  MONITOR_TYPE,
  OPENSEARCH_DASHBOARDS_AD_PLUGIN,
  SEARCH_TYPE,
} from '../../../../../utils/constants';
import { API_TYPES } from '../../../../CreateMonitor/components/ClusterMetricsMonitor/utils/clusterMetricsMonitorConstants';
import { getApiType } from '../../../../CreateMonitor/components/ClusterMetricsMonitor/utils/clusterMetricsMonitorHelpers';

// TODO: used in multiple places, move into helper
export function getTime(time) {
  // TODO: Use OpenSearch Dashboards saved timezone (if there is one, if not THEN default to using browser)
  const momentTime = moment.tz(time, moment.tz.guess());
  if (time && momentTime.isValid()) return momentTime.format('MM/DD/YY h:mm a z');
  return DEFAULT_EMPTY_DATA;
}

function getMonitorType(searchType, monitor) {
  switch (searchType) {
    case SEARCH_TYPE.GRAPH:
      return 'Visual Graph';
    case SEARCH_TYPE.AD:
      return 'Anomaly Detector';
    case SEARCH_TYPE.CLUSTER_METRICS:
      const uri = _.get(monitor, 'inputs.0.uri');
      const apiType = getApiType(uri);
      const apiTypeLabel = _.get(API_TYPES, `${apiType}.label`);
      return apiTypeLabel;
    default:
      return 'Extraction Query';
  }
}

function getMonitorLevelType(monitorType) {
  switch (monitorType) {
    case MONITOR_TYPE.QUERY_LEVEL:
      return 'Per query monitor';
    case MONITOR_TYPE.BUCKET_LEVEL:
      return 'Per bucket monitor';
    case MONITOR_TYPE.CLUSTER_METRICS:
      return 'Per cluster metrics monitor';
    default:
      // TODO: May be valuable to implement a toast that displays in this case.
      console.log('Unexpected monitor type:', monitorType);
      return '-';
  }
}

export default function getOverviewStats(
  monitor,
  monitorId,
  monitorVersion,
  activeCount,
  detector,
  detectorId
) {
  const searchType = _.has(monitor, 'inputs[0].uri')
    ? SEARCH_TYPE.CLUSTER_METRICS
    : _.get(monitor, 'ui_metadata.search.searchType', 'query');

  const detectorOverview = detector
    ? [
        {
          header: 'Detector',
          value: (
            <EuiLink
              href={`${OPENSEARCH_DASHBOARDS_AD_PLUGIN}#/detectors/${detectorId}`}
              target="_blank"
            >
              {detector.name} <EuiIcon size="s" type="popout" />
            </EuiLink>
          ),
        },
      ]
    : [];
  const monitorLevelType = _.get(monitor, 'ui_metadata.monitor_type', 'query_level_monitor');
  return [
    {
      header: 'Monitor type',
      value: getMonitorLevelType(monitorLevelType),
    },
    {
      header: 'Monitor definition type',
      value: getMonitorType(searchType, monitor),
    },
    ...detectorOverview,
    {
      header: 'Total active alerts',
      value: activeCount,
    },
    {
      header: 'Schedule',
      value: getScheduleFromMonitor(monitor),
    },
    {
      header: 'Last updated',
      value: getTime(monitor.last_update_time),
    },
    {
      header: 'Monitor ID',
      value: monitorId,
    },
    {
      header: 'Monitor version number',
      value: monitorVersion,
    },
    {
      /* There are 3 cases:
      1. Monitors created by older versions and never updated.
         These monitors won’t have User details in the monitor object. `monitor.user` will be null.
      2. Monitors are created when security plugin is disabled, these will have empty User object.
         (`monitor.user.name`, `monitor.user.roles` are empty )
      3. Monitors are created when security plugin is enabled, these will have an User object. */
      header: 'Last updated by',
      value: monitor.user && monitor.user.name ? monitor.user.name : '-',
    },
  ];
}
