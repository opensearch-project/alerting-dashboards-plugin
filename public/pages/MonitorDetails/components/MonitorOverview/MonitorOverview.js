/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiFlexGrid, EuiFlexItem } from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel/index';
import OverviewStat from '../OverviewStat/index';
import getOverviewStats from './utils/getOverviewStats';
import { PLUGIN_NAME } from '../../../../../utils/constants';
import { RelatedMonitors } from '../RelatedMonitors/RelatedMonitors';
import { RelatedMonitorsFlyout } from '../RelatedMonitors/RelatedMonitorsFlyout';

const MonitorOverview = ({
  monitor,
  monitorId,
  monitorVersion,
  activeCount,
  detector,
  detectorId,
  delegateMonitors,
}) => {
  const [flyoutData, setFlyoutData] = useState(undefined);
  const items = getOverviewStats(
    monitor,
    monitorId,
    monitorVersion,
    activeCount,
    detector,
    detectorId
  );

  let relatedMonitorsStat = null;
  let relatedMonitorsData = null;

  if (monitor.associated_workflows) {
    const links = monitor.associated_workflows.map(({ id, name }) => ({
      name,
      href: `${PLUGIN_NAME}#/monitors/${id}?type=${'workflow'}`,
    }));

    relatedMonitorsData = {
      header: 'Associations with composite monitors',
      tableHeader: 'Composite monitors',
      links,
    };
  } else if (delegateMonitors.length) {
    const links = delegateMonitors.map(({ id, name }) => ({
      name,
      href: `${PLUGIN_NAME}#/monitors/${id}?type=${'monitor'}`,
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
        <EuiFlexGrid columns={4}>
          {items.map((props) => (
            <OverviewStat key={props.header} {...props} />
          ))}
          {relatedMonitorsStat}
        </EuiFlexGrid>
      </ContentPanel>
    </>
  );
};

export default MonitorOverview;
