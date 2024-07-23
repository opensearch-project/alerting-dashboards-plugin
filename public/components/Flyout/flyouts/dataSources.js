/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiBasicTable,
  EuiFlexGroup,
  EuiSmallButtonIcon,
  EuiTitle,
  EuiFlexItem,
} from '@elastic/eui';
import { MONITOR_TYPE } from '../../../utils/constants';

export const DATA_SOURCES_FLYOUT_TYPE = 'dataSources';

const dataSources = ({
  closeFlyout = () => {},
  dataSources = [],
  localClusterName = '',
  monitorType = MONITOR_TYPE.QUERY_LEVEL,
}) => {
  const columns = [
    {
      field: 'cluster',
      name: 'Data connection',
      sortable: true,
      truncateText: true,
    },
  ];
  switch (monitorType) {
    case MONITOR_TYPE.CLUSTER_METRICS:
      // Cluster metrics monitors do not use indexes as data sources; excluding that column.
      break;
    default:
      columns.push({
        field: 'index',
        name: 'Index',
        sortable: true,
        truncateText: true,
      });
  }

  const indexItems = dataSources.map((dataSource = '', int) => {
    const item = { id: int };
    switch (monitorType) {
      case MONITOR_TYPE.CLUSTER_METRICS:
        item.cluster =
          dataSource === localClusterName ? `${dataSource} (Local)` : `${dataSource} (Remote)`;
        break;
      default:
        const shouldSplit = dataSource.includes(':');
        const splitIndex = dataSource.split(':');
        let clusterName = shouldSplit ? splitIndex[0] : localClusterName;
        clusterName =
          clusterName === localClusterName ? `${clusterName} (Local)` : `${clusterName} (Remote)`;
        const indexName = shouldSplit ? splitIndex[1] : dataSource;
        item.cluster = clusterName;
        item.index = indexName;
    }
    return item;
  });

  return {
    flyoutProps: {
      'aria-labelledby': 'dataSourcesFlyout',
      size: 'm',
      hideCloseButton: true,
      'data-test-subj': `dataSourcesFlyout`,
    },
    headerProps: { hasBorder: true },
    header: (
      <EuiFlexGroup justifyContent="flexStart" alignItems="center">
        <EuiFlexItem className={'eui-textTruncate'}>
          <EuiTitle
            className={'eui-textTruncate'}
            size={'m'}
            data-test-subj={'dataSourcesFlyout_header'}
          >
            <h3>{`Index`}</h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSmallButtonIcon
            data-test-subj={'dataSourcesFlyout_closeButton'}
            iconType={'cross'}
            display={'empty'}
            iconSize={'m'}
            onClick={closeFlyout}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
    footerProps: { style: { backgroundColor: '#F5F7FA' } },
    body: (
      <EuiBasicTable
        items={indexItems}
        itemId={(item) => item.id}
        columns={columns}
        pagination={true}
        isSelectable={false}
        hasActions={false}
        noItemsMessage={'No data sources configured for this monitor.'}
        data-test-subj={'dataSourcesFlyout_table'}
      />
    ),
  };
};

export default dataSources;
