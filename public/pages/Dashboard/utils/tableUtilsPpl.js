/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiLink, EuiToolTip } from '@elastic/eui';
import moment from 'moment';
import { ALERT_STATE, DEFAULT_EMPTY_DATA } from '../../../utils/constants';
import { AlertInsight } from '../../../components/AlertInsight';
import { getDataSourceId } from '../../utils/helpers';

export const renderTime = (time, options = { showFromNow: false }) => {
  const momentTime = moment(time);
  if (time && momentTime.isValid()) {
    return options.showFromNow ? momentTime.fromNow() : momentTime.format('MM/DD/YY h:mm a');
  }
  return DEFAULT_EMPTY_DATA;
};

export const renderUtcTime = (time) => {
  const utcMoment = moment.utc(time);
  return time && utcMoment.isValid() ? utcMoment.format('MM/DD/YY HH:mm:ss') : DEFAULT_EMPTY_DATA;
};

export const queryColumns = [
  {
    field: 'start_time',
    name: 'Alert start time',
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
  },
  {
    field: 'end_time',
    name: 'Alert end time',
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
  },
  {
    field: 'trigger_name',
    name: 'Trigger name',
    sortable: true,
    truncateText: true,
    textOnly: true,
  },
  {
    field: 'severity',
    name: 'Severity',
    sortable: false,
    truncateText: false,
  },
  {
    field: 'state',
    name: 'State',
    sortable: false,
    truncateText: false,
    render: (state, alert) => {
      const stateText =
        typeof state !== 'string' ? DEFAULT_EMPTY_DATA : _.capitalize(state.toLowerCase());
      return state === ALERT_STATE.ERROR ? `${stateText}: ${alert.error_message}` : stateText;
    },
  },
];

export const bucketColumns = [
  {
    field: 'start_time',
    name: 'Alert start time',
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
  },
  {
    field: 'end_time',
    name: 'Alert last updated',
    sortable: true,
    truncateText: false,
    render: (endTime, alert) => {
      const ackTime = alert.acknowledged_time;
      return renderTime(Math.max(endTime, ackTime));
    },
    dataType: 'date',
  },
  {
    field: 'state',
    name: 'State',
    sortable: false,
    truncateText: false,
    render: (state, alert) => {
      const stateText =
        typeof state !== 'string' ? DEFAULT_EMPTY_DATA : _.capitalize(state.toLowerCase());
      return state === ALERT_STATE.ERROR ? `${stateText}: ${alert.error_message}` : stateText;
    },
  },
  {
    field: 'trigger_name',
    name: 'Trigger name',
    sortable: true,
    truncateText: true,
    textOnly: true,
  },
  {
    field: 'severity',
    name: 'Severity',
    sortable: false,
    truncateText: false,
  },
];

export const alertColumnsPpl = (
  history,
  httpClient,
  loadingMonitors,
  location,
  monitors,
  notifications,
  isAgentConfigured,
  setFlyout,
  openFlyout,
  closeFlyout,
  refreshDashboard,
  viewMode = 'new'
) => {
  const columns = [
    {
      field: 'total',
      name: 'Alerts',
      sortable: true,
      truncateText: false,
      render: (total, alert) => {
        const alertId = `alerts_${alert.alerts[0].id}`;
        const component = (
          <EuiLink
            key={alertId}
            onClick={() => {
              openFlyout({
                ...alert,
                history,
                httpClient,
                loadingMonitors,
                location,
                monitors,
                notifications,
                setFlyout,
                closeFlyout,
                refreshDashboard,
              });
            }}
            data-test-subj={`euiLink_${alert.trigger_name}`}
          >
            {total > 1 ? `${total} alerts` : `${total} alert`}
          </EuiLink>
        );
        const datasourceId = getDataSourceId();
        return (
          <AlertInsight
            alert={alert.alerts[0]}
            isAgentConfigured={isAgentConfigured}
            alertId={alertId}
            datasourceId={datasourceId}
            viewMode={viewMode}
          >
            {component}
          </AlertInsight>
        );
      },
    },
  ];

  if (viewMode === 'classic') {
    columns.push(
      {
        field: 'ACTIVE',
        name: 'Active',
        sortable: true,
        truncateText: false,
      },
      {
        field: 'ACKNOWLEDGED',
        name: 'Acknowledged',
        sortable: true,
        truncateText: false,
      },
      {
        field: 'ERROR',
        name: 'Errors',
        sortable: true,
        truncateText: false,
      }
    );
  }

  columns.push(
    {
      field: 'trigger_name',
      name: 'Trigger name',
      sortable: true,
      truncateText: true,
      textOnly: true,
    },
    {
      field: viewMode === 'classic' ? 'start_time' : 'lastTriggeredTime',
      name: viewMode === 'classic' ? 'Trigger start time' : 'Last Triggered Time',
      sortable: true,
      truncateText: true,
      render: (timestamp, row) => {
        if (viewMode === 'classic') {
          return renderTime(timestamp);
        }
        let value = timestamp;
        if (value == null && Array.isArray(row?.alerts) && row.alerts.length) {
          const newest = _.maxBy(row.alerts, (a) => (a?.triggered_time ?? a?.start_time) || 0);
          value = newest?.triggered_time ?? newest?.start_time ?? null;
        }
        return renderUtcTime(value);
      },
      dataType: 'date',
      'data-test-subj': viewMode === 'classic' ? 'trigger-start-time' : 'last-triggered-time',
    },
    {
      field: viewMode === 'classic' ? 'last_notification_time' : 'lastTriggeredTime',
      name: 'Trigger last updated',
      sortable: true,
      truncateText: true,
      render: renderTime,
      dataType: 'date',
    },
    {
      field: 'severity',
      name: 'Severity',
      sortable: false,
      truncateText: false,
    },
    {
      field: 'monitor_name',
      name: 'Monitor name',
      sortable: true,
      truncateText: true,
      textOnly: true,
      render: (name, alert) => (
        <EuiLink href={`#/monitors/${alert.monitor_id}?type=${alert.alert_source}`}>{name}</EuiLink>
      ),
    }
  );

  return columns;
};

export const associatedAlertsTableColumns = [
  {
    field: 'start_time',
    name: 'Alert start time',
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
  },
  {
    field: 'severity',
    name: 'Severity',
    sortable: true,
    truncateText: false,
    width: '100px',
  },
  {
    name: 'Delegate monitor',
    sortable: true,
    truncateText: true,
    render: ({ monitor_id, monitor_name }) => {
      return (
        <EuiToolTip content={monitor_name}>
          <EuiLink href={`#/monitors/${monitor_id}?type='monitor'`} target="_blank">
            {monitor_name}
          </EuiLink>
        </EuiToolTip>
      );
    },
  },
  {
    field: 'trigger_name',
    name: 'Trigger name',
    sortable: true,
    truncateText: true,
    textOnly: true,
  },
  {
    field: 'state',
    name: 'State',
    truncateText: true,
    textOnly: true,
  },
];
