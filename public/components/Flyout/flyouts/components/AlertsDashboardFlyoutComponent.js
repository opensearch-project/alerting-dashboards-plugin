/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import {
  EuiBasicTable,
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiLink,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiToolTip,
  EuiSmallButtonIcon,
} from '@elastic/eui';
import { getTime } from '../../../../pages/MonitorDetails/components/MonitorOverview/utils/getOverviewStats';
import { PLUGIN_NAME } from '../../../../../utils/constants';
import {
  ALERT_STATE,
  DEFAULT_EMPTY_DATA,
  MONITOR_GROUP_BY,
  MONITOR_INPUT_DETECTOR_ID,
  MONITOR_TYPE,
  OPENSEARCH_DASHBOARDS_AD_PLUGIN,
  SEARCH_TYPE,
} from '../../../../utils/constants';
import { TRIGGER_TYPE } from '../../../../pages/CreateTrigger/containers/CreateTrigger/utils/constants';
import { UNITS_OF_TIME } from '../../../../pages/CreateMonitor/components/MonitorExpressions/expressions/utils/constants';
import { DEFAULT_WHERE_EXPRESSION_TEXT } from '../../../../pages/CreateMonitor/components/MonitorExpressions/expressions/utils/whereHelpers';
import { acknowledgeAlerts, backendErrorNotification } from '../../../../utils/helpers';
import {
  getQueryObjectFromState,
  getURLQueryParams,
  insertGroupByColumn,
  removeColumns,
} from '../../../../pages/Dashboard/utils/helpers';
import DashboardControls from '../../../../pages/Dashboard/components/DashboardControls';
import ContentPanel from '../../../ContentPanel';
import { queryColumns } from '../../../../pages/Dashboard/utils/tableUtils';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../../../../pages/Monitors/containers/Monitors/utils/constants';
import queryString from 'query-string';
import { MAX_ALERT_COUNT } from '../../../../pages/Dashboard/utils/constants';
import { SEVERITY_OPTIONS } from '../../../../pages/CreateTrigger/utils/constants';
import {
  getAlertsFindingColumn,
  TABLE_TAB_IDS,
} from '../../../../pages/Dashboard/components/FindingsDashboard/findingsUtils';
import FindingsDashboard from '../../../../pages/Dashboard/containers/FindingsDashboard';
import { CLUSTER_METRICS_CROSS_CLUSTER_ALERT_TABLE_COLUMN } from '../../../../pages/CreateMonitor/components/ClusterMetricsMonitor/utils/clusterMetricsMonitorConstants';
import {
  getDataSources,
  getLocalClusterName,
} from '../../../../pages/CreateMonitor/components/CrossClusterConfigurations/utils/helpers';
import {
  appendCommentsAction,
  getDataSourceId,
  getIsCommentsEnabled,
} from '../../../../pages/utils/helpers';

export const DEFAULT_NUM_FLYOUT_ROWS = 10;

export default class AlertsDashboardFlyoutComponent extends Component {
  constructor(props) {
    super(props);
    const { location, monitors, monitor_id } = this.props;
    const monitor = _.get(_.find(monitors, { _id: monitor_id }), '_source');
    let monitorType = _.get(monitor, 'monitor_type', undefined);
    if (!monitorType) {
      monitorType = _.get(monitor, 'workflow_type', MONITOR_TYPE.QUERY_LEVEL);
    }
    const { alertState, from, search, severityLevel, size, sortDirection, sortField } =
      getURLQueryParams(location);

    this.state = {
      alerts: [],
      alertState: alertState,
      loading: true,
      localClusterName: undefined,
      monitor: monitor,
      monitorIds: [monitor_id],
      monitorType: monitorType,
      page: Math.floor(from / size),
      search: search,
      selectable: true,
      selectedItems: [],
      severityLevel: severityLevel,
      size: DEFAULT_NUM_FLYOUT_ROWS,
      sortDirection: sortDirection,
      sortField: sortField,
      tabContent: undefined,
      tabId: TABLE_TAB_IDS.ALERTS.id,
      totalAlerts: 0,
      commentsEnabled: false,
    };
  }

  componentDidMount() {
    const { alertState, page, search, severityLevel, size, sortDirection, sortField, monitorIds } =
      this.state;
    this.getAlerts(
      page * size,
      size,
      search,
      sortField,
      sortDirection,
      severityLevel,
      alertState,
      monitorIds
    );
    this.getLocalClusterName();
    getIsCommentsEnabled(this.props.httpClient).then((commentsEnabled) => {
      this.setState({
        commentsEnabled,
      });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const prevQuery = getQueryObjectFromState(prevState);
    const currQuery = getQueryObjectFromState(this.state);
    if (!_.isEqual(prevQuery, currQuery)) {
      const {
        page,
        size,
        search,
        sortField,
        sortDirection,
        severityLevel,
        alertState,
        monitorIds,
      } = this.state;
      this.getAlerts(
        page * size,
        size,
        search,
        sortField,
        sortDirection,
        severityLevel,
        alertState,
        monitorIds
      );
    }
    const { monitorType } = this.state;
    if (
      [MONITOR_TYPE.DOC_LEVEL, MONITOR_TYPE.COMPOSITE_LEVEL].includes(monitorType) &&
      !_.isEqual(prevState.selectedItems, this.state.selectedItems)
    )
      this.setState({ tabContent: this.renderAlertsTable() });
  }

  getMultipleGraphConditions = (trigger) => {
    let conditions = _.get(trigger, 'condition.script.source');
    if (_.isEmpty(conditions)) {
      return DEFAULT_EMPTY_DATA;
    } else {
      conditions = conditions.replaceAll(' && ', '&AND&');
      conditions = conditions.replaceAll(' || ', '&OR&');
      conditions = conditions.split(/&/);
      return conditions.join('\n');
    }
  };

  getLocalClusterName = async () => {
    this.setState({
      localClusterName: await getLocalClusterName(this.props.httpClient),
    });
  };

  getSeverityText = (severity) => {
    return _.get(_.find(SEVERITY_OPTIONS, { value: severity }), 'text');
  };

  getBucketLevelGraphFilter = (trigger) => {
    const compositeAggFilter = _.get(trigger, 'condition.composite_agg_filter');
    if (_.isEmpty(compositeAggFilter)) return DEFAULT_WHERE_EXPRESSION_TEXT;
    const keyword = _.keys(compositeAggFilter)[0];
    const operator = _.keys(compositeAggFilter[keyword])[0];
    const value = _.get(compositeAggFilter, `${keyword}.${operator}`);
    return `${keyword} ${_.upperCase(operator)}S ${value}`;
  };

  getAlerts = async () => {
    this.setState({ loading: true, tabContent: undefined });
    const {
      from,
      search,
      sortField,
      sortDirection,
      severityLevel,
      alertState,
      monitorIds,
      monitorType,
    } = this.state;

    const { httpClient, history, notifications, triggerID } = this.props;

    const params = {
      from,
      size: MAX_ALERT_COUNT,
      search,
      sortField,
      sortDirection,
      severityLevel,
      alertState,
      monitorIds,
      monitorType,
    };

    const queryParamsString = queryString.stringify(params);
    history.replace({ ...this.props.location, search: queryParamsString });
    const dataSourceId = getDataSourceId();
    const extendedParams = {
      ...(dataSourceId !== undefined && { dataSourceId }), // Only include dataSourceId if it exists
      ...params, // Other parameters
    };
    httpClient.get('../api/alerting/alerts', { query: extendedParams })?.then((resp) => {
      if (resp.ok) {
        const { alerts } = resp;
        const filteredAlerts = _.filter(alerts, { trigger_id: triggerID });
        this.setState({
          ...this.state,
          alerts: filteredAlerts,
          totalAlerts: filteredAlerts.length,
        });
      } else {
        console.log('error getting alerts:', resp);
        backendErrorNotification(notifications, 'get', 'alerts', resp.err);
      }
      this.setState({ tabContent: this.renderAlertsTable() });
    });
    this.setState({ loading: false });
  };

  acknowledgeAlerts = async () => {
    const { selectedItems } = this.state;
    if (!selectedItems.length) return;

    const { httpClient, notifications } = this.props;
    acknowledgeAlerts(httpClient, notifications, selectedItems);

    const { page, size, search, sortField, sortDirection, severityLevel, alertState, monitorIds } =
      this.state;
    await this.getAlerts(
      page * size,
      size,
      search,
      sortField,
      sortDirection,
      severityLevel,
      alertState,
      monitorIds
    );
    this.setState({ selectedItems: [] });
    this.props.refreshDashboard();
  };

  onAlertStateChange = (e) => {
    this.setState({ page: 0, alertState: e.target.value });
  };

  onPageClick = (page) => {
    this.setState({ page });
  };

  onSearchChange = (e) => {
    this.setState({ page: 0, search: e.target.value });
  };

  onSelectionChange = (selectedItems) => {
    this.setState({ selectedItems });
  };

  onTableChange = ({ page: tablePage = {}, sort = {} }) => {
    const { index: page, size } = tablePage;

    const { field: sortField, direction: sortDirection } = sort;
    this.setState({
      page,
      size,
      sortField,
      sortDirection,
    });

    const { alerts } = this.props;
    this.setState({ alerts });
  };

  getTriggerType() {
    const { monitorType } = this.state;
    switch (monitorType) {
      case MONITOR_TYPE.BUCKET_LEVEL:
        return TRIGGER_TYPE.BUCKET_LEVEL;
      case MONITOR_TYPE.DOC_LEVEL:
        return TRIGGER_TYPE.DOC_LEVEL;
      case MONITOR_TYPE.COMPOSITE_LEVEL:
        return TRIGGER_TYPE.COMPOSITE_LEVEL;
      default:
        return TRIGGER_TYPE.QUERY_LEVEL;
    }
  }

  renderAlertsTable() {
    const { httpClient, history, location, notifications, trigger_name } = this.props;
    const {
      alerts,
      alertState,
      loading,
      monitor,
      monitorType,
      page,
      search,
      selectable,
      selectedItems,
      severityLevel,
      size,
      sortDirection,
      sortField,
      totalAlerts,
      commentsEnabled,
    } = this.state;

    const detectorId = _.get(monitor, MONITOR_INPUT_DETECTOR_ID);
    const groupBy = _.get(monitor, MONITOR_GROUP_BY);

    const getItemId = (item) => {
      switch (monitorType) {
        case MONITOR_TYPE.QUERY_LEVEL:
        case MONITOR_TYPE.CLUSTER_METRICS:
        case MONITOR_TYPE.DOC_LEVEL:
        case MONITOR_TYPE.COMPOSITE_LEVEL:
          return `${item.id}-${item.version}`;
        case MONITOR_TYPE.BUCKET_LEVEL:
          return item.id;
      }
    };

    const getColumns = () => {
      let columns;
      switch (monitorType) {
        case MONITOR_TYPE.BUCKET_LEVEL:
          columns = insertGroupByColumn(groupBy);
          break;
        case MONITOR_TYPE.CLUSTER_METRICS:
          columns = _.cloneDeep(queryColumns);
          columns.push(CLUSTER_METRICS_CROSS_CLUSTER_ALERT_TABLE_COLUMN);
          break;
        case MONITOR_TYPE.DOC_LEVEL:
          columns = _.cloneDeep(queryColumns);
          columns.splice(
            0,
            0,
            getAlertsFindingColumn(httpClient, history, location, notifications)
          );
          break;
        case MONITOR_TYPE.COMPOSITE_LEVEL:
          columns = _.cloneDeep(queryColumns);
          columns.push({
            name: 'Actions',
            sortable: false,
            actions: [
              {
                render: (alert) => (
                  <EuiToolTip content={'View details'}>
                    <EuiSmallButtonIcon
                      aria-label={'View details'}
                      data-test-subj={`view-details-icon`}
                      iconType={'inspect'}
                      onClick={() => {
                        this.props.openChainedAlertsFlyout?.(alert);
                      }}
                    />
                  </EuiToolTip>
                ),
              },
            ],
          });
          break;
        default:
          columns = queryColumns;
          break;
      }
      columns = removeColumns(['severity', 'trigger_name'], columns);

      if (commentsEnabled) {
        columns = appendCommentsAction(columns, httpClient);
      }

      return columns;
    };

    const pagination = {
      pageIndex: page,
      pageSize: size,
      totalItemCount: totalAlerts,
      pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
    };

    const selection = {
      initialSelected: selectedItems,
      onSelectionChange: this.onSelectionChange,
      selectable: (item) => item.state === ALERT_STATE.ACTIVE,
      selectableMessage: (selectable) =>
        selectable ? undefined : 'Only active alerts can be acknowledged.',
    };

    const sorting = {
      sort: {
        direction: sortDirection,
        field: sortField,
      },
    };

    const actions = () => {
      const actions = [
        <EuiSmallButton
          onClick={this.acknowledgeAlerts}
          disabled={selectedItems.length <= 0}
          data-test-subj={'flyoutAcknowledgeAlertsButton'}
        >
          Acknowledge
        </EuiSmallButton>,
      ];
      if (!_.isEmpty(detectorId)) {
        actions.unshift(
          <EuiSmallButton
            href={`${OPENSEARCH_DASHBOARDS_AD_PLUGIN}#/detectors/${detectorId}`}
            target="_blank"
          >
            View detector <EuiIcon type="popout" />
          </EuiSmallButton>
        );
      }
      return actions;
    };

    const trimmedAlerts = alerts.slice(page * size, page * size + size);
    return (
      <ContentPanel
        title={'Alerts'}
        titleSize={'s'}
        bodyStyles={{ padding: 'initial' }}
        actions={actions()}
      >
        <DashboardControls
          activePage={page}
          pageCount={Math.ceil(totalAlerts / size) || 1}
          search={search}
          severity={severityLevel}
          state={alertState}
          onSearchChange={this.onSearchChange}
          onStateChange={this.onAlertStateChange}
          onPageChange={this.onPageClick}
          isAlertsFlyout={true}
          monitorType={monitorType}
        />
        <EuiHorizontalRule margin="xs" />
        <EuiBasicTable
          items={loading ? [] : trimmedAlerts}
          /*
           * If using just ID, doesn't update selectedItems when doing acknowledge
           * because the next getAlerts have the same id
           * $id-$version will correctly remove selected items
           * */
          itemId={getItemId}
          columns={getColumns()}
          loading={loading}
          pagination={pagination}
          sorting={sorting}
          isSelectable={selectable}
          selection={selection}
          hasActions={true}
          onChange={this.onTableChange}
          noItemsMessage={loading ? 'Loading alerts...' : 'No alerts.'}
          data-test-subj={`alertsDashboardFlyout_table_${trigger_name}`}
        />
      </ContentPanel>
    );
  }

  renderFindingsTable(findingId) {
    const { httpClient, history, location, monitor_id, notifications } = this.props;
    return (
      <FindingsDashboard
        findingId={findingId}
        isAlertsFlyout={true}
        isPreview={false}
        monitorId={monitor_id}
        httpClient={httpClient}
        location={location}
        history={history}
        notifications={notifications}
      />
    );
  }

  renderTableTabs() {
    const { tabId } = this.state;
    const tabs = [
      { ...TABLE_TAB_IDS.ALERTS, content: this.renderAlertsTable() },
      { ...TABLE_TAB_IDS.FINDINGS, content: this.renderFindingsTable() },
    ];

    return tabs.map((tab, index) => (
      <EuiTab
        key={`${tab.id}${index}`}
        isSelected={tab.id === tabId}
        onClick={() => {
          this.setState({
            tabId: tab.id,
            tabContent: tab.content,
          });
        }}
      >
        {tab.name}
      </EuiTab>
    ));
  }

  render() {
    const {
      last_notification_time,
      loadingMonitors,
      monitor_id,
      monitor_name,
      start_time,
      triggerID,
      trigger_name,
    } = this.props;
    const { loading, localClusterName, monitor, monitorType, tabContent } = this.state;
    const searchType = _.get(monitor, 'ui_metadata.search.searchType', SEARCH_TYPE.GRAPH);
    const triggerType = this.getTriggerType(monitorType);

    let trigger = _.get(monitor, 'triggers', []).find(
      (trigger) => trigger[triggerType].id === triggerID
    );
    trigger = _.get(trigger, triggerType);

    const severity = _.get(trigger, 'severity');
    const groupBy = _.get(monitor, MONITOR_GROUP_BY);

    const condition =
      searchType === SEARCH_TYPE.GRAPH &&
      (monitorType === MONITOR_TYPE.BUCKET_LEVEL || monitorType === MONITOR_TYPE.DOC_LEVEL)
        ? this.getMultipleGraphConditions(trigger)
        : _.get(trigger, 'condition.script.source', DEFAULT_EMPTY_DATA);

    let displayMultipleConditions;
    switch (monitorType) {
      case MONITOR_TYPE.BUCKET_LEVEL:
      case MONITOR_TYPE.DOC_LEVEL:
        displayMultipleConditions = true;
        break;
      default:
        displayMultipleConditions = false;
    }

    const filters =
      monitorType === MONITOR_TYPE.BUCKET_LEVEL && searchType === SEARCH_TYPE.GRAPH
        ? this.getBucketLevelGraphFilter(trigger)
        : DEFAULT_EMPTY_DATA;

    const bucketValue = _.get(monitor, 'ui_metadata.search.bucketValue');
    let bucketUnitOfTime = _.get(monitor, 'ui_metadata.search.bucketUnitOfTime');
    UNITS_OF_TIME.map((entry) => {
      if (entry.value === bucketUnitOfTime) bucketUnitOfTime = entry.text;
    });
    const timeRangeForLast =
      bucketValue !== undefined && !_.isEmpty(bucketUnitOfTime)
        ? `${bucketValue} ${bucketUnitOfTime}`
        : DEFAULT_EMPTY_DATA;

    let displayTableTabs;
    switch (monitorType) {
      case MONITOR_TYPE.DOC_LEVEL:
        displayTableTabs = true;
        break;
      default:
        displayTableTabs = false;
        break;
    }
    const monitorUrl = `${PLUGIN_NAME}#/monitors/${monitor_id}${
      monitorType === MONITOR_TYPE.COMPOSITE_LEVEL ? '?type=workflow' : ''
    }`;

    const dataSources = getDataSources(monitor, localClusterName).join('\n');
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size="s" data-test-subj={`alertsDashboardFlyout_triggerName_${trigger_name}`}>
              <strong>Trigger name</strong>
              <p>{trigger_name}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s" data-test-subj={`alertsDashboardFlyout_severity_${trigger_name}`}>
              <strong>Severity</strong>
              <p>{this.getSeverityText(severity) || severity || DEFAULT_EMPTY_DATA}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size="s">
              <strong>Trigger start time</strong>
              <p>{getTime(start_time)}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">
              <strong>Trigger last updated</strong>
              <p>{getTime(last_notification_time)}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size="s" data-test-subj={`alertsDashboardFlyout_monitor_${trigger_name}`}>
              <strong>Monitor</strong>
              <p>
                <EuiLink href={monitorUrl}>{monitor_name}</EuiLink>
              </p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">
              <strong>Monitor data sources</strong>
              <p style={{ whiteSpace: 'pre-wrap' }}>{dataSources}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiHorizontalRule margin={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size="s" data-test-subj={`alertsDashboardFlyout_conditions_${trigger_name}`}>
              <strong>{displayMultipleConditions ? 'Conditions' : 'Condition'}</strong>
              <p style={{ whiteSpace: 'pre-wrap' }}>
                {loadingMonitors || loading ? 'Loading conditions...' : condition}
              </p>
            </EuiText>
          </EuiFlexItem>

          {![MONITOR_TYPE.DOC_LEVEL, MONITOR_TYPE.COMPOSITE_LEVEL].includes(monitorType) && (
            <EuiFlexItem>
              <EuiText size="s" data-test-subj={`alertsDashboardFlyout_timeRange_${trigger_name}`}>
                <strong>Time range for the last</strong>
                <p>{timeRangeForLast}</p>
              </EuiText>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>

        {![MONITOR_TYPE.DOC_LEVEL, MONITOR_TYPE.COMPOSITE_LEVEL].includes(monitorType) && (
          <div>
            <EuiSpacer size={'xxl'} />

            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiText size="s" data-test-subj={`alertsDashboardFlyout_filters_${trigger_name}`}>
                  <strong>Filters</strong>
                  <p>{loadingMonitors || loading ? 'Loading filters...' : filters}</p>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiText size="s" data-test-subj={`alertsDashboardFlyout_groupBy_${trigger_name}`}>
                  <strong>Group by</strong>
                  <p>
                    {loadingMonitors || loading
                      ? 'Loading groups...'
                      : !_.isEmpty(groupBy)
                      ? _.join(_.orderBy(groupBy), ', ')
                      : DEFAULT_EMPTY_DATA}
                  </p>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        )}

        <EuiSpacer size={'xxl'} />
        <EuiHorizontalRule margin={'none'} />
        <EuiSpacer size={displayTableTabs ? 'l' : 'xxl'} />

        {displayTableTabs ? (
          <div>
            <EuiTabs size="s">{this.renderTableTabs()}</EuiTabs>
            {tabContent}
          </div>
        ) : (
          this.renderAlertsTable()
        )}
        <EuiSpacer size={'l'} />
      </div>
    );
  }
}
