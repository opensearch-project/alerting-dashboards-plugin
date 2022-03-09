/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { ALERT_TIMELINE_COLORS_MAP } from '../../../containers/MonitorHistory/utils/constants';

const timeSeriesLegend = [
  {
    title: 'Triggered',
    color: ALERT_TIMELINE_COLORS_MAP.TRIGGERED,
  },
  {
    title: 'Error',
    color: ALERT_TIMELINE_COLORS_MAP.ERROR,
  },
  {
    title: 'Acknowledge',
    color: ALERT_TIMELINE_COLORS_MAP.ACKNOWLEDGED,
  },
  {
    title: 'No alerts',
    color: ALERT_TIMELINE_COLORS_MAP.NO_ALERTS,
  },
];

const bucketTimeSeriesLegend = [
  {
    title: 'Triggered',
    color: ALERT_TIMELINE_COLORS_MAP.TRIGGERED,
  },
  {
    title: 'No alerts',
    color: ALERT_TIMELINE_COLORS_MAP.NO_ALERTS,
  },
];

const Legend = ({ showBucketLegend }) => {
  const legend = showBucketLegend ? bucketTimeSeriesLegend : timeSeriesLegend;
  return (
    <EuiFlexGroup style={{ marginLeft: '20px' }} alignItems="center">
      {legend.map((legendItem) => (
        <EuiFlexItem grow={false} key={legendItem.title}>
          <EuiFlexGroup gutterSize="xs" style={{ height: '30px' }} alignItems="center">
            <EuiFlexItem style={{ height: '30px' }}>
              <div
                style={{
                  height: '100%',
                  width: '15px',
                  backgroundColor: legendItem.color,
                }}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="xs">{legendItem.title}</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};

export default Legend;
