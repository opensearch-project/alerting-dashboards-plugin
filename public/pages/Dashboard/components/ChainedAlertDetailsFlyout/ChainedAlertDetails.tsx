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
  EuiButtonIcon,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiInMemoryTable
} from '@elastic/eui';
import OverviewStat from '../../../MonitorDetails/components/OverviewStat';
import { DEFAULT_EMPTY_DATA } from '../../../../utils/constants';
import { associatedAlertsTableColumns, renderTime } from '../../utils/tableUtils';
import _ from 'lodash';

export const ChainedAlertDetails = ({ alert }) => {
  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState<{
    [key: string]: JSX.Element;
  }>({});

  const toggleCorrelationDetails = (item: any) => {
    const itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMapValues[item.id]) {
      delete itemIdToExpandedRowMapValues[item.id];
    } else {
      itemIdToExpandedRowMapValues[item.id] = (
        <EuiPanel color="subdued" className={'associated-alerts-table-details-row'}>
          <EuiFlexGroup justifyContent="flexStart">
            <EuiFlexItem grow={false} style={{ minWidth: 200 }}>
              <EuiText size={'xs'}>State</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
              <EuiText size={'xs'} className={'associated-alerts-table-details-row-value'}>
                {typeof item.state !== 'string' ? DEFAULT_EMPTY_DATA : _.capitalize(item.state.toLowerCase())}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiFlexGroup justifyContent="flexStart">
            <EuiFlexItem grow={false} style={{ minWidth: 200 }}>
              <EuiText size={'xs'}>End time</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
              <EuiText size={'xs'} className={'associated-alerts-table-details-row-value'}>
                {item.end_time}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiFlexGroup justifyContent="flexStart">
            <EuiFlexItem grow={false} style={{ minWidth: 200 }}>
              <EuiText size={'xs'}>Time acknowledged</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
              <EuiText size={'xs'} className={'associated-alerts-table-details-row-value'}>
                {item.acknowledged_time || DEFAULT_EMPTY_DATA}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      );
    }

    setItemIdToExpandedRowMap(itemIdToExpandedRowMapValues);
  };

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

  const dummyItems = [
    {
      id: '3m4k_4gBao9NSj-nooCV',
      start_time: 1687907771029,
      end_time: 1687907771029,
      severity: "1",
      state: 'ACTIVE',
      trigger_name: 'Sample trigger',
      acknowledged_time: undefined
    }
  ];

  const actions: any[] = [
    {
      render: (item: any) => (
        <EuiButtonIcon
          onClick={() => toggleCorrelationDetails(item)}
          aria-label={itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'}
          iconType={itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
        />
      ),
    },
  ];

  return (
    <>
      <EuiFlexGrid columns={4}>
        {overviewItems.map((props) => (
          <OverviewStat key={props.header} {...props} />
        ))}
      </EuiFlexGrid>
      <EuiSpacer size='xl' />
      <EuiTitle>
        <h2>Alerts from associated monitors</h2>
      </EuiTitle>
      <EuiSpacer size='m' />
      <EuiInMemoryTable
        columns={associatedAlertsTableColumns.concat(actions) as EuiBasicTableColumn<any>[]}
        items={dummyItems}
        itemId='id'
        itemIdToExpandedRowMap={itemIdToExpandedRowMap}
        hasActions={true}
        isExpandable={true}
        pagination={true}
      />
    </>
  )
}