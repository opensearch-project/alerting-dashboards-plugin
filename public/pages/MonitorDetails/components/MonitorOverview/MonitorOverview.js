/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiFlexGrid, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel/index';
import OverviewStat from '../OverviewStat/index';
import getOverviewStats from './utils/getOverviewStats';
import { RelatedMonitors } from '../RelatedMonitors/RelatedMonitors';
import { RelatedMonitorsFlyout } from '../RelatedMonitors/RelatedMonitorsFlyout';
import { getURL } from '../../../utils/helpers';

const MonitorOverview = ({
  monitor,
  monitorId,
  monitorVersion,
  activeCount,
  detector,
  detectorId,
  delegateMonitors,
  localClusterName,
  setFlyout,
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

  const items = getOverviewStats(
    monitor,
    monitorId,
    monitorVersion,
    activeCount,
    detector,
    detectorId,
    localClusterName,
    setFlyout
  );
  
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
        <EuiFlexGroup gutterSize="xl" wrap={false} responsive={false} justifyContent="spaceBetween">
          {items.map((props) => (
            <EuiFlexItem key={props.header} grow={true}>
              <OverviewStat {...props} />
            </EuiFlexItem>
          ))}
          {relatedMonitorsStat}
        </EuiFlexGroup>
      </ContentPanel>
    </>
  );
};

export default MonitorOverview;
