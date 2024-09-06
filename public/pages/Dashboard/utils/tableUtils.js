/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiLink, EuiToolTip } from '@elastic/eui';
import moment from 'moment';
import { ALERT_STATE, DEFAULT_EMPTY_DATA, MONITOR_TYPE } from '../../../utils/constants';
import { getApplication, getAssistantDashboards } from '../../../services';
import { getDataSourceQueryObj } from '../../../pages/utils/helpers';

export const renderTime = (time) => {
  const momentTime = moment(time);
  if (time && momentTime.isValid()) return momentTime.format('MM/DD/YY h:mm a');
  return DEFAULT_EMPTY_DATA;
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
  {
    field: 'acknowledged_time',
    name: 'Time acknowledged',
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
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

export const alertColumns = (
  history,
  httpClient,
  loadingMonitors,
  location,
  monitors,
  notifications,
  setFlyout,
  openFlyout,
  closeFlyout,
  refreshDashboard
) => [
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
          {`${total} alerts`}
        </EuiLink>
      );
      const contextProvider = async () => {
        // 1. get monitor definition
        const dataSourceQuery = getDataSourceQueryObj();
        const monitorResp = await httpClient.get(
          `../api/alerting/monitors/${alert.monitor_id}`,
          dataSourceQuery
        );
        const monitorDefinition = monitorResp.resp;
        delete monitorDefinition.ui_metadata;
        delete monitorDefinition.data_sources;

        let monitorDefinitionStr = JSON.stringify(monitorDefinition);

        // 2. get data triggers the alert
        let alertTriggeredByData = '';
        let dsl = '';
        let index = '';
        if (
          monitorResp.resp.monitor_type === MONITOR_TYPE.QUERY_LEVEL ||
          monitorResp.resp.monitor_type === MONITOR_TYPE.BUCKET_LEVEL
        ) {
          const search = monitorResp.resp.inputs[0].search;
          const indices = String(search.indices);
          const splitIndices = indices.split(',');
          index = splitIndices.length > 0 ? splitIndices[0].trim() : '';
          let query = JSON.stringify(search.query);
          // Only keep the query part
          dsl = JSON.stringify({ query: search.query.query });
          if (query.indexOf('{{period_end}}') !== -1) {
            query = query.replaceAll('{{period_end}}', alert.start_time);
            const alertStartTime = moment.utc(alert.start_time).format('YYYY-MM-DDTHH:mm:ss');
            dsl = dsl.replaceAll('{{period_end}}', alertStartTime);
            // as we changed the format, remove it
            dsl = dsl.replaceAll('"format":"epoch_millis",', '');
            monitorDefinitionStr = monitorDefinitionStr.replaceAll(
              '{{period_end}}',
              alertStartTime
            );
            // as we changed the format, remove it
            monitorDefinitionStr = monitorDefinitionStr.replaceAll('"format":"epoch_millis",', '');
          }
          if (index) {
            const alertData = await httpClient.post(`/api/console/proxy`, {
              query: {
                path: `${index}/_search`,
                method: 'GET',
                dataSourceId: dataSourceQuery ? dataSourceQuery.query.dataSourceId : '',
              },
              body: query,
              prependBasePath: true,
              asResponse: true,
              withLongNumeralsSupport: true,
            });

            alertTriggeredByData = JSON.stringify(alertData.body);
          }
        }

        const filteredAlert = { ...alert };
        const topN = 10;
        const activeAlerts = alert.alerts.filter((alert) => alert.state === 'ACTIVE');
        // Reduce llm input token size by taking topN active alerts
        filteredAlert.alerts = activeAlerts.slice(0, topN);

        // 3. build the context
        return {
          context: `
            Here is the detail information about alert ${alert.trigger_name}
            ### Monitor definition\n ${monitorDefinitionStr}\n
            ### Active Alert\n ${JSON.stringify(filteredAlert)}\n
            ### Data triggers this alert\n ${alertTriggeredByData}\n
            ### Alert query DSL ${dsl} \n`,
          additionalInfo: {
            monitorType: monitorResp.resp.monitor_type,
            dsl: dsl,
            index: index,
          },
        };
      };

      const isSubscriptionActive =
        getApplication().capabilities?.assistant?.isSubscriptionActive === true;
      const assistantFeatureStatus = getAssistantDashboards().getFeatureStatus();
      if (assistantFeatureStatus.alertInsight && isSubscriptionActive) {
        getAssistantDashboards().registerIncontextInsight([
          {
            key: alertId,
            type: 'generate',
            suggestions: [`Please summarize this alert, do not use any tool.`],
            contextProvider,
          },
        ]);
        return getAssistantDashboards().renderIncontextInsight({ children: component });
      } else {
        return component;
      }
    },
  },
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
  },
  {
    field: 'trigger_name',
    name: 'Trigger name',
    sortable: true,
    truncateText: true,
    textOnly: true,
  },
  {
    field: 'start_time',
    name: 'Trigger start time',
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
  },
  {
    field: 'last_notification_time',
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
  },
];

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
