/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel/index';
import OverviewStat from '../OverviewStat/index';
import getOverviewStatsV2 from './utils/getOverviewStatsV2';
import { RelatedMonitors } from '../RelatedMonitors/RelatedMonitors';
import { RelatedMonitorsFlyout } from '../RelatedMonitors/RelatedMonitorsFlyout';
import { getURL } from '../../../utils/helpers';

const MonitorOverviewV2 = ({
  monitor,
  monitorId,
  activeCount,
  delegateMonitors,
  landingDataSourceId,
}) => {
  const [flyoutData, setFlyoutData] = useState(undefined);

  let relatedMonitorsStat = null;
  let relatedMonitorsData = null;
  if (monitor.associated_workflows) {
    const links = monitor.associated_workflows.map(({ id, name }) => ({
      name,
      href: getURL(`#/monitors/${id}?type=workflow`, landingDataSourceId),
    }));
    relatedMonitorsData = {
      header: 'Associations with composite monitors',
      tableHeader: 'Composite monitors',
      links,
    };
  } else if (delegateMonitors.length) {
    const links = delegateMonitors.map(({ id, name }) => ({
      name,
      href: getURL(`#/monitors/${id}?type=monitor`, landingDataSourceId),
    }));

    relatedMonitorsData = {
      header: 'Delegate monitors',
      tableHeader: 'Delegate monitors',
      links,
    };
  }
  if (relatedMonitorsData) {
    const { header, links } = relatedMonitorsData;
    const value =
      links.length > 0 ? (
        <RelatedMonitors links={links} onShowAll={() => setFlyoutData(relatedMonitorsData)} />
      ) : (
        '-'
      );

    relatedMonitorsStat = (
      <EuiFlexItem style={{ overflow: 'hidden' }}>
        <OverviewStat key={header} header={header} value={value} />
      </EuiFlexItem>
    );
  }

  const onFlyoutClose = () => setFlyoutData(undefined);

  const { firstRow, secondRow } = getOverviewStatsV2(monitor, monitorId, activeCount);

  return (
    <>
      {flyoutData && (
        <RelatedMonitorsFlyout
          links={flyoutData.links}
          flyoutData={flyoutData}
          onClose={onFlyoutClose}
        />
      )}
      <ContentPanel title="Overview" titleSize="s">
        <EuiFlexGroup direction="column" gutterSize="m">
          <EuiFlexItem>
            <EuiFlexGroup
              gutterSize="xl"
              wrap={false}
              responsive={false}
              justifyContent="spaceBetween"
            >
              {firstRow.map((props) => (
                <EuiFlexItem key={props.header} grow={true}>
                  <OverviewStat {...props} />
                </EuiFlexItem>
              ))}
              {relatedMonitorsStat}
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFlexGroup gutterSize="xl" wrap={true} responsive={false} alignItems="flexStart">
              {secondRow.map((props) => (
                <EuiFlexItem
                  key={props.header}
                  grow={false}
                  style={{
                    minWidth: '200px',
                    maxWidth: '100%',
                    flexBasis: 'auto',
                    flexGrow: 1,
                  }}
                >
                  <OverviewStat {...props} />
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      </ContentPanel>
    </>
  );
};

export default MonitorOverviewV2;
