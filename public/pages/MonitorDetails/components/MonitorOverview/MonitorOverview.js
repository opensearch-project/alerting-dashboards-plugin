/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGrid } from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel/index';
import OverviewStat from '../OverviewStat/index';
import getOverviewStats from './utils/getOverviewStats';

const MonitorOverview = ({
  monitor,
  monitorId,
  monitorVersion,
  activeCount,
  detector,
  detectorId,
}) => {
  const items = getOverviewStats(
    monitor,
    monitorId,
    monitorVersion,
    activeCount,
    detector,
    detectorId
  );
  return (
    <ContentPanel title="Overview" titleSize="s">
      <EuiFlexGrid columns={4}>
        {items.map((props) => (
          <OverviewStat key={props.header} {...props} />
        ))}
      </EuiFlexGrid>
    </ContentPanel>
  );
};

export default MonitorOverview;
