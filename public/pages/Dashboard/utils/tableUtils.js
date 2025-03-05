/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiLink, EuiToolTip } from '@elastic/eui';
import moment from 'moment';
import { ALERT_STATE, DEFAULT_EMPTY_DATA, MONITOR_TYPE, SEARCH_TYPE } from '../../../utils/constants';
import { getApplication, getAssistantDashboards } from '../../../services';
import { getDataSourceQueryObj } from '../../../pages/utils/helpers';
import { OPERATORS_PPL_QUERY_MAP } from "../../CreateMonitor/containers/CreateMonitor/utils/whereFilters";
import { filterActiveAlerts, findLongestStringField, searchQuery } from "./helpers";
import {
  BUCKET_UNIT_PPL_UNIT_MAP,
  DEFAULT_ACTIVE_ALERTS_TOP_N,
  DEFAULT_DSL_QUERY_DATE_FORMAT,
  DEFAULT_LOG_PATTERN_SAMPLE_SIZE,
  DEFAULT_LOG_PATTERN_TOP_N,
  DEFAULT_PPL_QUERY_DATE_FORMAT,
  PERIOD_END_PLACEHOLDER,
  PPL_SEARCH_PATH
} from "./constants";
import { escape } from 'lodash';
import { getTime } from "../../MonitorDetails/components/MonitorOverview/utils/getOverviewStats";

export const renderTime = (time, options = { showFromNow: false }) => {
  const momentTime = moment(time);
  if (time && momentTime.isValid())
    return options.showFromNow ? momentTime.fromNow() : momentTime.format('MM/DD/YY h:mm a');
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
  isAgentConfigured,
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
          {total > 1 ? `${total} alerts`:`${total} alert`}
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
        // 2. If the monitor is created via visual editor, translate ui_metadata dsl filter to ppl filter
        let formikToPPLFilters = [];
        let pplBucketValue = 1;
        let pplBucketUnitOfTime = 'HOUR';
        let pplTimeField = '';
        const isVisualEditorMonitor = monitorDefinition?.ui_metadata?.search?.searchType === SEARCH_TYPE.GRAPH;
        if (isVisualEditorMonitor) {
          const uiFilters = monitorDefinition?.ui_metadata?.search?.filters || []
          formikToPPLFilters = uiFilters.map((filter) => OPERATORS_PPL_QUERY_MAP[filter.operator].query(filter));
          pplBucketValue = monitorDefinition?.ui_metadata?.search?.bucketValue || 1;
          pplBucketUnitOfTime = BUCKET_UNIT_PPL_UNIT_MAP[monitorDefinition?.ui_metadata?.search?.bucketUnitOfTime] || 'HOUR';
          pplTimeField = monitorDefinition?.ui_metadata?.search?.timeField;
        }
        delete monitorDefinition.ui_metadata;
        delete monitorDefinition.data_sources;

        // 3. get data triggers the alert and fetch log patterns
        let monitorDefinitionStr = JSON.stringify(monitorDefinition);
        let alertTriggeredByValue = '';
        let dsl = '';
        let index = '';
        let topNLogPatternData = '';
        if (
          monitorResp.resp.monitor_type === MONITOR_TYPE.QUERY_LEVEL ||
          monitorResp.resp.monitor_type === MONITOR_TYPE.BUCKET_LEVEL
        ) {
          // 3.1 preprocess index, only support first index use case
          const search = monitorResp.resp.inputs[0].search;
          index = String(search.indices).split(',')[0]?.trim() || '';
          // 3.2 preprocess dsl query with right time range
          let query = JSON.stringify(search.query);
          // Only keep the query part
          dsl = JSON.stringify({ query: search.query.query });
          let latestAlertTriggerTime = '';
          if (query.indexOf(PERIOD_END_PLACEHOLDER) !== -1) {
            query = query.replaceAll(PERIOD_END_PLACEHOLDER, alert.last_notification_time);
            latestAlertTriggerTime = moment.utc(alert.last_notification_time).format(DEFAULT_DSL_QUERY_DATE_FORMAT);
            dsl = dsl.replaceAll(PERIOD_END_PLACEHOLDER, latestAlertTriggerTime);
            // as we changed the format, remove it
            dsl = dsl.replaceAll('"format":"epoch_millis",', '');
            monitorDefinitionStr = monitorDefinitionStr.replaceAll(
              PERIOD_END_PLACEHOLDER,
              getTime(alert.last_notification_time) // human-readable time format for summary
            );
            // as we changed the format, remove it
            monitorDefinitionStr = monitorDefinitionStr.replaceAll('"format":"epoch_millis",', '');
          }
          // 3.3 preprocess ppl query base with concatenated filters
          const pplAlertTriggerTime = moment.utc(alert.last_notification_time).format(DEFAULT_PPL_QUERY_DATE_FORMAT);
          const basePPL = `source=${index} | ` +
            `where ${pplTimeField} >= TIMESTAMPADD(${pplBucketUnitOfTime}, -${pplBucketValue}, '${pplAlertTriggerTime}') and ` +
            `${pplTimeField} <= TIMESTAMP('${pplAlertTriggerTime}')`;
          const basePPLWithFilters = formikToPPLFilters.reduce((acc, filter) => {
            return `${acc} | where ${filter}`;
          }, basePPL);
          const firstSamplePPL = `${basePPLWithFilters} | head 1`;

          if (index) {
            // 3.4 dsl query result with aggregation results
            const alertData = await searchQuery(httpClient, `${index}/_search`, 'GET', dataSourceQuery, query);
            alertTriggeredByValue = JSON.stringify(
              alertData.body.aggregations?.metric?.value || alertData.body.hits.total.value
            );

            if (isVisualEditorMonitor) {
              // 3.5 find the log pattern field by longest length in the first sample data
              const firstSampleData = await searchQuery(httpClient, PPL_SEARCH_PATH, 'POST', dataSourceQuery, JSON.stringify({ query: firstSamplePPL }));
              const patternField = findLongestStringField(firstSampleData);

              // 3.6 log pattern query to get top N log patterns
              if (patternField) {
                const topNLogPatternPPL = `${basePPLWithFilters} | patterns ${patternField} | ` +
                  `stats count() as count, take(${patternField}, ${DEFAULT_LOG_PATTERN_SAMPLE_SIZE}) by patterns_field | ` +
                  `sort - count | head ${DEFAULT_LOG_PATTERN_TOP_N}`;
                const logPatternData = await searchQuery(httpClient, PPL_SEARCH_PATH, 'POST', dataSourceQuery, JSON.stringify({ query: topNLogPatternPPL }));
                topNLogPatternData = escape(JSON.stringify(logPatternData?.body?.datarows || ''));
              }
            }
          }
        }

        // 3.6 only keep top N active alerts and replace time with human-readable timezone format
        const activeAlerts = filterActiveAlerts(alert.alerts).slice(0, DEFAULT_ACTIVE_ALERTS_TOP_N)
          .map(activeAlert => ({
            ...activeAlert,
            start_time: getTime(activeAlert.start_time),
            last_notification_time: getTime(activeAlert.last_notification_time)
          }));
        // Reduce llm input token size by taking topN active alerts
        const filteredAlert = { ...alert, alerts: activeAlerts, start_time: getTime(alert.start_time),
          last_notification_time: getTime(alert.last_notification_time) };

        // 4. build the context
        return {
          context: `
            Here is the detail information about alert ${alert.trigger_name}
            ### Monitor definition\n ${monitorDefinitionStr}\n
            ### Active Alert\n ${JSON.stringify(filteredAlert)}\n
            ### Value triggers this alert\n ${alertTriggeredByValue}\n
            ### Alert query DSL ${dsl} \n`,
          additionalInfo: {
            monitorType: monitorResp.resp.monitor_type,
            dsl: dsl,
            index: index,
            topNLogPatternData: topNLogPatternData,
            isVisualEditorMonitor: isVisualEditorMonitor,
          },
          dataSourceId: dataSourceQuery?.query?.dataSourceId,
        };
      };

      const assistantEnabled = getApplication().capabilities?.assistant?.enabled === true;
      const assistantFeatureStatus = getAssistantDashboards().getFeatureStatus();
      if (assistantFeatureStatus.alertInsight && assistantEnabled && isAgentConfigured) {
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
