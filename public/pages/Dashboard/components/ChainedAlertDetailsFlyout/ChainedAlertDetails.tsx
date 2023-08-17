/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import {
  EuiFlexGrid,
  EuiTitle,
  EuiSpacer,
  EuiBasicTableColumn,
  EuiInMemoryTable
} from '@elastic/eui';
import OverviewStat from '../../../MonitorDetails/components/OverviewStat';
import { DEFAULT_EMPTY_DATA } from '../../../../utils/constants';
import { associatedAlertsTableColumns, renderTime } from '../../utils/tableUtils';
import _ from 'lodash';

export const ChainedAlertDetails = ({ alert, associatedAlerts }) => {
  const overviewItems = [
    {
      header: 'Trigger name',
      value: alert.trigger_name || DEFAULT_EMPTY_DATA
    },
    {
      header: 'Alert start time',
      value: renderTime(alert.start_time) || DEFAULT_EMPTY_DATA
    },
    {
      header: 'State',
      value: typeof alert.state !== 'string' ? DEFAULT_EMPTY_DATA : _.capitalize(alert.state.toLowerCase())
    },
    {
      header: 'Severity',
      value: alert.severity
    }
  ];

  return (
    <>
      <EuiFlexGrid columns={4}>
        {overviewItems.map((props) => (
          <OverviewStat key={props.header} {...props} />
        ))}
      </EuiFlexGrid>
      <EuiSpacer size='xl' />
      <EuiTitle size='s'>
        <p>Delegate monitor alerts</p>
      </EuiTitle>
      <EuiSpacer size='m' />
      <EuiInMemoryTable
        columns={associatedAlertsTableColumns as EuiBasicTableColumn<any>[]}
        items={associatedAlerts}
        isExpandable={true}
        pagination={true}
        sorting={true}
      />
    </>
  )
}