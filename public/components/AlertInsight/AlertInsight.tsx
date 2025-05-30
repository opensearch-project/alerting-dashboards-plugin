/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { escape } from 'lodash';
import { OPERATORS_PPL_QUERY_MAP } from '../../pages/CreateMonitor/containers/CreateMonitor/utils/whereFilters';
import {
  BUCKET_UNIT_PPL_UNIT_MAP,
  DEFAULT_ACTIVE_ALERTS_AI_TOP_N,
  DEFAULT_DSL_QUERY_DATE_FORMAT,
  DEFAULT_LOG_PATTERN_SAMPLE_SIZE,
  DEFAULT_LOG_PATTERN_TOP_N,
  DEFAULT_PPL_QUERY_DATE_FORMAT,
  PERIOD_END_PLACEHOLDER,
  PPL_SEARCH_PATH,
} from '../../pages/Dashboard/utils/constants';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../utils/constants';
import { getTime } from '../../pages/MonitorDetails/components/MonitorOverview/utils/getOverviewStats';
import {
  filterActiveAlerts,
  findLongestStringField,
  searchQuery,
} from '../../pages/Dashboard/utils/helpers';
import { getApplication, getAssistantDashboards, getClient } from '../../services';
import { dataSourceEnabled } from '../../pages/utils/helpers';

export interface AlertInsightProps {
  alert: any;
  alertId: string;
  isAgentConfigured: boolean;
  children: React.ReactElement;
  datasourceId?: string;
}

export const AlertInsight: React.FC<AlertInsightProps> = (props: AlertInsightProps) => {
  const { alert, children, isAgentConfigured, alertId, datasourceId } = props;
  const httpClient = getClient();
  const dataSourceQuery = dataSourceEnabled()
    ? { query: { dataSourceId: datasourceId || '' } }
    : undefined;

  const contextProvider = async () => {
    // 1. get monitor definition
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
    const isVisualEditorMonitor =
      monitorDefinition?.ui_metadata?.search?.searchType === SEARCH_TYPE.GRAPH;
    if (isVisualEditorMonitor) {
      const uiFilters = monitorDefinition?.ui_metadata?.search?.filters || [];
      formikToPPLFilters = uiFilters.map((filter) =>
        OPERATORS_PPL_QUERY_MAP[filter.operator].query(filter)
      );
      pplBucketValue = monitorDefinition?.ui_metadata?.search?.bucketValue || 1;
      pplBucketUnitOfTime =
        BUCKET_UNIT_PPL_UNIT_MAP[monitorDefinition?.ui_metadata?.search?.bucketUnitOfTime] ||
        'HOUR';
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
        latestAlertTriggerTime = moment
          .utc(alert.last_notification_time)
          .format(DEFAULT_DSL_QUERY_DATE_FORMAT);
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
      const pplAlertTriggerTime = moment
        .utc(alert.last_notification_time)
        .format(DEFAULT_PPL_QUERY_DATE_FORMAT);
      const basePPL =
        `source=${index} | ` +
        `where ${pplTimeField} >= TIMESTAMPADD(${pplBucketUnitOfTime}, -${pplBucketValue}, '${pplAlertTriggerTime}') and ` +
        `${pplTimeField} <= TIMESTAMP('${pplAlertTriggerTime}')`;
      const basePPLWithFilters = formikToPPLFilters.reduce((acc, filter) => {
        return `${acc} | where ${filter}`;
      }, basePPL);
      const firstSamplePPL = `${basePPLWithFilters} | head 1`;

      if (index) {
        // 3.4 dsl query result with aggregation results
        const alertData = await searchQuery(
          httpClient,
          `${index}/_search`,
          'GET',
          dataSourceQuery,
          query
        );
        alertTriggeredByValue = JSON.stringify(
          alertData.body.aggregations?.metric?.value || alertData.body.hits.total.value
        );

        try {
          if (isVisualEditorMonitor) {
            // 3.5 find the log pattern field by longest length in the first sample data
            const firstSampleData = await searchQuery(
              httpClient,
              PPL_SEARCH_PATH,
              'POST',
              dataSourceQuery,
              JSON.stringify({ query: firstSamplePPL })
            );
            const patternField = findLongestStringField(firstSampleData);

            // 3.6 log pattern query to get top N log patterns
            if (patternField) {
              const topNLogPatternPPL =
                `${basePPLWithFilters} | patterns ${patternField} | ` +
                `stats count() as count, take(${patternField}, ${DEFAULT_LOG_PATTERN_SAMPLE_SIZE}) by patterns_field | ` +
                `sort - count | head ${DEFAULT_LOG_PATTERN_TOP_N}`;
              const logPatternData = await searchQuery(
                httpClient,
                PPL_SEARCH_PATH,
                'POST',
                dataSourceQuery,
                JSON.stringify({ query: topNLogPatternPPL })
              );
              topNLogPatternData = escape(JSON.stringify(logPatternData?.body?.datarows || ''));
            }
          }
        } catch (error) {
          topNLogPatternData = '';
        }
      }
    }

    // 3.6 only keep top N active alerts and replace time with human-readable timezone format
    const activeAlerts = filterActiveAlerts(alert.alerts || [alert])
      .slice(0, DEFAULT_ACTIVE_ALERTS_AI_TOP_N)
      .map((activeAlert) => ({
        ...activeAlert,
        start_time: getTime(activeAlert.start_time),
        last_notification_time: getTime(activeAlert.last_notification_time),
      }));
    // Reduce llm input token size by taking topN active alerts
    const filteredAlert = {
      ...alert,
      alerts: activeAlerts,
      start_time: getTime(alert.start_time),
      last_notification_time: getTime(alert.last_notification_time),
    };

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
        dsl,
        index,
        topNLogPatternData,
        isVisualEditorMonitor,
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
        suggestions: [`Please summarize this alert`],
        contextProvider,
      },
    ]);

    return getAssistantDashboards().renderIncontextInsight({ children });
  }
  return children;
};
