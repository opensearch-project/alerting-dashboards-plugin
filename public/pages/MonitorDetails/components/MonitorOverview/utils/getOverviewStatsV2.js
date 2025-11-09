/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import moment from 'moment-timezone';
import { EuiIcon, EuiToolTip } from '@elastic/eui';
import getScheduleFromPplMonitor from './getScheduleFromPplMonitor';
import { DEFAULT_EMPTY_DATA } from '../../../../../utils/constants';
import { formatDuration } from '../../../../CreateMonitor/containers/CreateMonitor/utils/pplAlertingHelpers';

const getTime = (time) => {
  if (!time) return DEFAULT_EMPTY_DATA;
  const momentTime = moment.utc(time);
  if (!momentTime.isValid()) return DEFAULT_EMPTY_DATA;
  return momentTime.format('YYYY-MM-DDTHH:mm:ss[Z]');
};

const getLastUpdatedHeader = () => {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      Last updated
      <EuiToolTip content="Time displayed in UTC">
        <EuiIcon type="iInCircle" size="s" style={{ marginLeft: '4px' }} />
      </EuiToolTip>
    </span>
  );
};

export default function getOverviewStatsV2(monitor, monitorId, activeCount = 0) {
  // Get look back window in minutes - check multiple possible locations
  const lookBackWindowMinutes =
    monitor?.look_back_window_minutes ?? monitor?.look_back_window ?? undefined;

  const firstRow = [
    {
      header: 'Total active alerts',
      value: activeCount,
    },
    {
      header: 'Schedule',
      value: getScheduleFromPplMonitor(monitor),
    },
    {
      header: 'Look back window',
      value: formatDuration(lookBackWindowMinutes),
    },
    {
      header: getLastUpdatedHeader(),
      value: getTime(monitor.last_update_time),
    },
    {
      header: 'Monitor ID',
      value: monitorId,
    },
  ];

  const secondRow = [
    {
      header: 'Description',
      value: monitor.description || DEFAULT_EMPTY_DATA,
    },
  ];

  return {
    firstRow,
    secondRow,
  };
}
