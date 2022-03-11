/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import {
  EuiBasicTable,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiLink,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { getTime } from '../../../../pages/MonitorDetails/components/MonitorOverview/utils/getOverviewStats';
import { PLUGIN_NAME } from '../../../../../utils/constants';
import {
  ALERT_STATE,
  MONITOR_GROUP_BY,
  MONITOR_INPUT_DETECTOR_ID,
  MONITOR_TYPE,
  OPENSEARCH_DASHBOARDS_AD_PLUGIN,
  SEARCH_TYPE,
} from '../../../../utils/constants';
import { TRIGGER_TYPE } from '../../../../pages/CreateTrigger/containers/CreateTrigger/utils/constants';
import { SEVERITY_OPTIONS } from '../../../../pages/CreateTrigger/containers/DefineTrigger/DefineTrigger';
import { UNITS_OF_TIME } from '../../../../pages/CreateMonitor/components/MonitorExpressions/expressions/utils/constants';
import { DEFAULT_WHERE_EXPRESSION_TEXT } from '../../../../pages/CreateMonitor/components/MonitorExpressions/expressions/utils/whereHelpers';
import { backendErrorNotification } from '../../../../utils/helpers';
import {
  displayAcknowledgedAlertsToast,
  filterActiveAlerts,
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

export const DEFAULT_NUM_FLYOUT_ROWS = 10;

export default class AlertsDashboardFlyoutComponent extends Component {
  constructor(props) {
    super(props);
    const { location, monitor_id } = this.props;

    const {
      alertState,
      from,
      search,
      severityLevel,
      size,
      sortDirection,
      sortField,
    } = getURLQueryParams(location);

    this.state = {
      alerts: [],
      alertState: alertState,
      loading: true,
      monitors: [],
      monitorIds: [monitor_id],
      page: Math.floor(from / size),
      search: search,
      selectable: true,
      selectedItems: [],
      severityLevel: severityLevel,
      size: DEFAULT_NUM_FLYOUT_ROWS,
      sortDirection: sortDirection,
      sortField: sortField,
      totalAlerts: 0,
    };
  }

  componentDidMount() {
    const {
      alertState,
      page,
      search,
      severityLevel,
      size,
      sortDirection,
      sortField,
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
  }

  getBucketLevelGraphConditions = (trigger) => {
    let conditions = _.get(trigger, 'condition.script.source', '-');
    conditions = _.replace(conditions, ' && ', '&AND&');
    conditions = _.replace(conditions, ' || ', '&OR&');
    conditions = conditions.split(/&/);
    return conditions.join('\n');
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
    this.setState({ ...this.state, loading: true });
    const {
      from,
      search,
      sortField,
      sortDirection,
      severityLevel,
      alertState,
      monitorIds,
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
    };

    const queryParamsString = queryString.stringify(params);
    history.replace({ ...this.props.location, search: queryParamsString });

    httpClient.get('../api/alerting/alerts', { query: params }).then((resp) => {
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
    });

    this.setState({ ...this.state, loading: false });
  };

  acknowledgeAlerts = async () => {
    const { selectedItems } = this.state;
    const { httpClient, notifications } = this.props;

    if (!selectedItems.length) return;

    const selectedAlerts = filterActiveAlerts(selectedItems);

    const monitorAlerts = selectedAlerts.reduce((monitorAlerts, alert) => {
      const { id, monitor_id: monitorId } = alert;
      if (monitorAlerts[monitorId]) monitorAlerts[monitorId].push(id);
      else monitorAlerts[monitorId] = [id];
      return monitorAlerts;
    }, {});

    Object.entries(monitorAlerts).map(([monitorId, alerts]) =>
      httpClient
        .post(`../api/alerting/monitors/${monitorId}/_acknowledge/alerts`, {
          body: JSON.stringify({ alerts }),
        })
        .then((resp) => {
          if (!resp.ok) {
            backendErrorNotification(notifications, 'acknowledge', 'alert', resp.resp);
          } else {
            const successfulCount = _.get(resp, 'resp.success', []).length;
            displayAcknowledgedAlertsToast(notifications, successfulCount);
          }
        })
        .catch((error) => error)
    );

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
    this.setState({ ...this.state, selectedItems: [] });
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

  render() {
    const {
      last_notification_time,
      loadingMonitors,
      monitors,
      monitor_id,
      monitor_name,
      start_time,
      triggerID,
      trigger_name,
    } = this.props;
    const monitor = _.get(_.find(monitors, { _id: monitor_id }), '_source');
    const monitorType = _.get(monitor, 'monitor_type', MONITOR_TYPE.QUERY_LEVEL);
    const searchType = _.get(monitor, 'ui_metadata.search.searchType', SEARCH_TYPE.GRAPH);
    const detectorId = _.get(monitor, MONITOR_INPUT_DETECTOR_ID);

    const triggerType =
      monitorType === MONITOR_TYPE.BUCKET_LEVEL
        ? TRIGGER_TYPE.BUCKET_LEVEL
        : TRIGGER_TYPE.QUERY_LEVEL;

    let trigger = _.get(monitor, 'triggers', []).find(
      (trigger) => trigger[triggerType].id === triggerID
    );
    trigger = _.get(trigger, triggerType);

    const severity = _.get(trigger, 'severity');
    const groupBy = _.get(monitor, MONITOR_GROUP_BY);

    const condition =
      monitorType === MONITOR_TYPE.BUCKET_LEVEL && searchType === SEARCH_TYPE.GRAPH
        ? this.getBucketLevelGraphConditions(trigger)
        : _.get(trigger, 'condition.script.source', '-');

    const filters =
      monitorType === MONITOR_TYPE.BUCKET_LEVEL && searchType === SEARCH_TYPE.GRAPH
        ? this.getBucketLevelGraphFilter(trigger)
        : '-';

    const bucketValue = _.get(monitor, 'ui_metadata.search.bucketValue');
    let bucketUnitOfTime = _.get(monitor, 'ui_metadata.search.bucketUnitOfTime');
    UNITS_OF_TIME.map((entry) => {
      if (entry.value === bucketUnitOfTime) bucketUnitOfTime = entry.text;
    });
    const timeRangeForLast =
      bucketValue !== undefined && !_.isEmpty(bucketUnitOfTime)
        ? `${bucketValue} ${bucketUnitOfTime}`
        : '-';

    const actions = () => {
      const { selectedItems } = this.state;
      const actions = [
        <EuiButton
          onClick={this.acknowledgeAlerts}
          disabled={!selectedItems.length}
          data-test-subj={'flyoutAcknowledgeAlertsButton'}
        >
          Acknowledge
        </EuiButton>,
      ];
      if (!_.isEmpty(detectorId)) {
        actions.unshift(
          <EuiButton
            href={`${OPENSEARCH_DASHBOARDS_AD_PLUGIN}#/detectors/${detectorId}`}
            target="_blank"
          >
            View detector <EuiIcon type="popout" />
          </EuiButton>
        );
      }
      return actions;
    };

    const getItemId = (item) => {
      switch (monitorType) {
        case MONITOR_TYPE.QUERY_LEVEL:
        case MONITOR_TYPE.CLUSTER_METRICS:
          return `${item.id}-${item.version}`;
        case MONITOR_TYPE.BUCKET_LEVEL:
          return item.id;
      }
    };

    const {
      alerts,
      alertState,
      loading,
      page,
      search,
      selectable,
      severityLevel,
      size,
      sortDirection,
      sortField,
      totalAlerts,
    } = this.state;

    const columnType = () => {
      let columns = [];
      switch (monitorType) {
        case MONITOR_TYPE.QUERY_LEVEL:
        case MONITOR_TYPE.CLUSTER_METRICS:
          columns = queryColumns;
          break;
        case MONITOR_TYPE.BUCKET_LEVEL:
          columns = insertGroupByColumn(groupBy);
          break;
      }
      return removeColumns(['severity', 'trigger_name'], columns);
    };

    const pagination = {
      pageIndex: page,
      pageSize: size,
      totalItemCount: totalAlerts,
      pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
    };

    const selection = {
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

    const trimmedAlerts = alerts.slice(page * size, page * size + size);

    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText
              size={'m'}
              data-test-subj={`alertsDashboardFlyout_triggerName_${trigger_name}`}
            >
              <strong>Trigger name</strong>
              <p>{trigger_name}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size={'m'} data-test-subj={`alertsDashboardFlyout_severity_${trigger_name}`}>
              <strong>Severity</strong>
              <p>{this.getSeverityText(severity) || severity || '-'}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>Trigger start time</strong>
              <p>{getTime(start_time)}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>Trigger last updated</strong>
              <p>{getTime(last_notification_time)}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size={'m'} data-test-subj={`alertsDashboardFlyout_monitor_${trigger_name}`}>
              <strong>Monitor</strong>
              <p>
                <EuiLink href={`${PLUGIN_NAME}#/monitors/${monitor_id}`}>{monitor_name}</EuiLink>
              </p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiHorizontalRule margin={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size={'m'} data-test-subj={`alertsDashboardFlyout_conditions_${trigger_name}`}>
              <strong>
                {monitorType === MONITOR_TYPE.BUCKET_LEVEL ? 'Conditions' : 'Condition'}
              </strong>
              <p style={{ whiteSpace: 'pre-wrap' }}>
                {loadingMonitors || loading ? 'Loading conditions...' : condition}
              </p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size={'m'} data-test-subj={`alertsDashboardFlyout_timeRange_${trigger_name}`}>
              <strong>Time range for the last</strong>
              <p>{timeRangeForLast}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size={'m'} data-test-subj={`alertsDashboardFlyout_filters_${trigger_name}`}>
              <strong>Filters</strong>
              <p>{loadingMonitors || loading ? 'Loading filters...' : filters}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size={'m'} data-test-subj={`alertsDashboardFlyout_groupBy_${trigger_name}`}>
              <strong>Group by</strong>
              <p>
                {loadingMonitors || loading
                  ? 'Loading groups...'
                  : !_.isEmpty(groupBy)
                  ? _.join(_.orderBy(groupBy), ', ')
                  : '-'}
              </p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiHorizontalRule margin={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
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
                columns={columnType()}
                loading={loading}
                pagination={pagination}
                sorting={sorting}
                isSelectable={selectable}
                selection={selection}
                onChange={this.onTableChange}
                noItemsMessage={loading ? 'Loading alerts...' : 'No alerts.'}
                data-test-subj={`alertsDashboardFlyout_table_${trigger_name}`}
              />
            </ContentPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size={'l'} />
      </div>
    );
  }
}
