/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { DEFAULT_EMPTY_DATA, MONITOR_TYPE } from '../../../../../utils/constants';

export const getLocalClusterName = async (httpClient) => {
  let localClusterName = DEFAULT_EMPTY_DATA;
  try {
    const response = await httpClient.get('../api/alerting/_health');
    if (response.ok) {
      localClusterName = response.resp[0]?.cluster;
    } else {
      console.log('Error getting local cluster name:', response);
    }
  } catch (e) {
    console.error(e);
  }
  return localClusterName;
};

export const getDataSources = (monitor, localClusterName) => {
  const monitorType = _.get(
    monitor,
    'monitor_type',
    _.get(monitor, 'ui_metadata.monitor_type', MONITOR_TYPE.QUERY_LEVEL)
  );
  let dataSources;
  switch (monitorType) {
    case MONITOR_TYPE.CLUSTER_METRICS:
      dataSources = _.get(monitor, 'inputs.0.uri.clusters');
      // To preserve functionality of legacy monitors, cluster metrics monitors run on the
      // local cluster by default if no clusters are specified in the monitor configuration.
      if (_.isEmpty(dataSources)) dataSources = [localClusterName || DEFAULT_EMPTY_DATA];
      break;
    case MONITOR_TYPE.DOC_LEVEL:
      dataSources = _.get(monitor, 'inputs.0.doc_level_input.indices', [DEFAULT_EMPTY_DATA]);
      break;
    default:
      dataSources = _.get(monitor, 'inputs.0.search.indices', [DEFAULT_EMPTY_DATA]);
  }
  dataSources = _.sortBy(dataSources);
  return dataSources;
};
