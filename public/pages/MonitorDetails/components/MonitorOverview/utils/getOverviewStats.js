/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiBadge, EuiLink } from '@elastic/eui';
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
import { DATA_SOURCES_FLYOUT_TYPE } from '../../../../../components/Flyout/flyouts/dataSources';
import { getDataSources } from '../../../../CreateMonitor/components/CrossClusterConfigurations/utils/helpers';

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
      return _.get(API_TYPES, `${apiType}.label`);
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
    case MONITOR_TYPE.DOC_LEVEL:
      return 'Per document monitor';
    case MONITOR_TYPE.COMPOSITE_LEVEL:
      return 'Composite monitor';
    default:
      // TODO: May be valuable to implement a toast that displays in this case.
      console.log('Unexpected monitor type:', monitorType);
      return '-';
  }
}

const getDataSourcesDisplay = (
  dataSources = [],
  localClusterName = DEFAULT_EMPTY_DATA,
  monitorType,
  setFlyout
) => {
  const closeFlyout = () => {
    if (typeof setFlyout === 'function') setFlyout(null);
  };

  const openFlyout = () => {
    if (typeof setFlyout === 'function') {
      setFlyout({
        type: DATA_SOURCES_FLYOUT_TYPE,
        payload: {
          closeFlyout: closeFlyout,
          dataSources: dataSources,
          localClusterName: localClusterName,
          monitorType: monitorType,
        },
      });
    }
  };

  return dataSources.length <= 1 ? (
    dataSources[0] || localClusterName
  ) : (
    <>
      {dataSources[0]}&nbsp;
      <EuiBadge
        color={'primary'}
        onClick={openFlyout}
        onClickAriaLabel={'View all data sources'}
        data-test-subj={'dataSourcesFlyout_badge'}
      >
        View all {dataSources.length}
      </EuiBadge>
    </>
  );
};

export default function getOverviewStats(
  monitor,
  monitorId,
  monitorVersion,
  activeCount,
  detector,
  detectorId,
  localClusterName,
  setFlyout
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
              {detector.name}
            </EuiLink>
          ),
        },
      ]
    : [];
  let monitorLevelType = _.get(monitor, 'monitor_type', undefined);
  if (!monitorLevelType) {
    monitorLevelType = _.get(monitor, 'ui_metadata.monitor_type', 'query_level_monitor');
  }

  const dataSources = getDataSources(monitor, localClusterName);

  const overviewStats = [
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
      header: 'Data sources',
      value: getDataSourcesDisplay(dataSources, localClusterName, monitorLevelType, setFlyout),
    },
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
  ];

  return overviewStats;
}
