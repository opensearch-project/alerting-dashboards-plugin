/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import moment from 'moment';
import {
  EuiBasicTable,
  EuiCompressedSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLink,
  EuiSmallButton,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { getTime } from '../../../../pages/MonitorDetails/components/MonitorOverview/utils/getOverviewStats';
import { ALERT_STATE, DEFAULT_EMPTY_DATA } from '../../../../utils/constants';
import {
  backendErrorNotification,
  getSeverityText,
  getDataSourceId,
} from '../../../../utils/helpers';
import { MAX_ALERT_COUNT } from '../../../../pages/Dashboard/utils/constants';
import { normalizePPLSeverity } from '../../../../pages/Dashboard/utils/pplSeverityUtils';
import {
  PplPreviewTable,
  pplRespToDocs,
} from '../../../../pages/CreateMonitor/components/PplPreviewTable/PplPreviewTable';

const DEFAULT_PAGE_SIZE = 5;

export default class AlertsDashboardFlyoutComponentPpl extends Component {
  constructor(props) {
    super(props);

    this.state = {
      alerts: [],
      alertState: 'ALL',
      loading: true,
      page: 0,
      size: DEFAULT_PAGE_SIZE,
      sortDirection: 'desc',
      sortField: 'start_time',
      totalAlerts: 0,
      openResultPopoverId: null,
    };

    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    this.getAlerts();
  }

  componentDidUpdate(prevProps, prevState) {
    const watchedStateFields = ['page', 'size', 'alertState', 'sortDirection', 'sortField'];

    if (
      prevProps.monitor_id !== this.props.monitor_id ||
      prevProps.triggerID !== this.props.triggerID
    ) {
      this.setState({ page: 0 }, () => this.getAlerts());
      return;
    }

    const hasQueryStateChanged = watchedStateFields.some(
      (field) => prevState[field] !== this.state[field]
    );

    if (hasQueryStateChanged) {
      this.getAlerts();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getAlerts = async () => {
    if (!this._isMounted) {
      return;
    }

    this.setState({ loading: true, openResultPopoverId: null });

    const { httpClient, notifications, triggerID, monitor_id, dataSourceId } = this.props;
    const resolvedDataSourceId =
      dataSourceId !== undefined
        ? dataSourceId
        : typeof getDataSourceId === 'function'
        ? getDataSourceId()
        : undefined;

    const { page, size, sortDirection, sortField, alertState } = this.state;

    const pageSize = size > 0 ? size : DEFAULT_PAGE_SIZE;
    if (size <= 0) {
      this.setState({ size: pageSize, loading: false }, () => this.getAlerts());
      return;
    }

    const query = {
      from: 0,
      size: MAX_ALERT_COUNT,
      sortField,
      sortDirection,
    };

    if (monitor_id) {
      query.monitorIds = [monitor_id];
    }

    if (resolvedDataSourceId !== undefined) {
      query.dataSourceId = resolvedDataSourceId;
    }

    try {
      const resp = await httpClient.get('/api/alerting/v2/monitors/alerts', {
        query,
      });

      if (!this._isMounted) {
        return;
      }

      if (!resp?.ok) {
        backendErrorNotification(notifications, 'get', 'alerts', resp?.resp);
        this.setState({ loading: false });
        return;
      }

      const payload = resp.resp || resp;
      const alertsArray = Array.isArray(payload?.alerts_v2) ? payload.alerts_v2 : [];
      const totalCountRaw = payload?.total_alerts_v2;
      const totalCount = Number.isFinite(Number(totalCountRaw))
        ? Number(totalCountRaw)
        : alertsArray.length;

      const stateFilter =
        alertState && alertState !== 'ALL' ? String(alertState).toUpperCase() : undefined;

      const filteredAlerts = alertsArray
        .filter((alert) => alert.trigger_v2_id === triggerID)
        .filter((alert) => {
          if (!stateFilter) return true;
          const stateValue = String(alert?.state || '').toUpperCase();
          return stateValue === stateFilter;
        });

      const sortedAlerts = filteredAlerts.slice().sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;

        if (sortField === 'start_time') {
          return (Number(a?.triggered_time) - Number(b?.triggered_time)) * direction;
        }

        const valueA = _.get(a, sortField);
        const valueB = _.get(b, sortField);

        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return -direction;
        if (valueB == null) return direction;

        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return (valueA - valueB) * direction;
        }

        if (moment(valueA).isValid() && moment(valueB).isValid()) {
          return (moment(valueA).valueOf() - moment(valueB).valueOf()) * direction;
        }

        return String(valueA).localeCompare(String(valueB)) * direction;
      });

      this.setState({
        alerts: sortedAlerts,
        totalAlerts: totalCount,
        loading: false,
      });
    } catch (err) {
      if (!this._isMounted) {
        return;
      }
      backendErrorNotification(notifications, 'get', 'alerts', err);
      this.setState({ loading: false });
    }
  };

  handleAlertStateChange = (e) => {
    this.setState({ alertState: e.target.value, page: 0 });
  };

  handleTableChange = ({ page: pageParams = {}, sort = {} }) => {
    const nextPage = pageParams.index ?? this.state.page;
    const requestedSize = pageParams.size ?? this.state.size;
    const nextSize = requestedSize > 0 ? requestedSize : DEFAULT_PAGE_SIZE;
    const nextSortField = sort.field ?? this.state.sortField;
    const nextSortDirection = sort.direction ?? this.state.sortDirection;

    this.setState({
      page: nextPage,
      size: nextSize,
      sortField: nextSortField,
      sortDirection: nextSortDirection,
    });
  };

  toggleResultsPopover = (itemId) => {
    this.setState((prev) => ({
      openResultPopoverId: prev.openResultPopoverId === itemId ? null : itemId,
    }));
  };

  renderQueryResultsPreview = (alert) => {
    const results = alert?.query_results;
    const schema = Array.isArray(results?.schema) ? results.schema : [];
    const dataRows = Array.isArray(results?.datarows) ? results.datarows : [];

    if (!schema.length || !dataRows.length) {
      return (
        <EuiText size="s" color="subdued">
          No results found.
        </EuiText>
      );
    }

    const docs = pplRespToDocs(results);
    return <PplPreviewTable docs={docs} />;
  };

  getItemId = (alert) => {
    const version = alert?.monitor_v2_version ?? alert?.version ?? '';
    return `${alert.id}-${version}`;
  };

  render() {
    const {
      alerts,
      alertState,
      loading,
      openResultPopoverId,
      page,
      size,
      sortField,
      sortDirection,
      totalAlerts,
    } = this.state;

    const { monitor = {}, monitor_id, monitor_name, trigger_name, start_time } = this.props;

    const pageSizeToUse = size > 0 ? size : DEFAULT_PAGE_SIZE;
    const displayedAlerts = alerts.slice(
      page * pageSizeToUse,
      page * pageSizeToUse + pageSizeToUse
    );
    const firstAlert = alerts[0] || {};

    const severity =
      normalizePPLSeverity(firstAlert?.severity) ||
      normalizePPLSeverity(_.get(monitor, 'triggers[0].severity')) ||
      firstAlert?.severity;

    const condition = firstAlert?.query || monitor?.query || DEFAULT_EMPTY_DATA;

    const monitorUrl = monitor_id ? `#/monitors/${monitor_id}` : '#/monitors';

    const severityDisplay = getSeverityText(severity) || severity || DEFAULT_EMPTY_DATA;

    const columns = [
      {
        field: 'triggered_time',
        name: 'Alert triggered time',
        sortable: true,
        dataType: 'date',
        render: (time) => {
          const momentTime = moment(time);
          if (time && momentTime.isValid()) {
            return momentTime.format('MM/DD/YY h:mm a');
          }
          return DEFAULT_EMPTY_DATA;
        },
      },
      {
        field: 'query_results',
        name: '',
        align: 'right',
        render: (_value, item) => {
          const hasResults =
            Array.isArray(item?.query_results?.datarows) && item.query_results.datarows.length;
          if (!hasResults) {
            return (
              <EuiText size="s" color="subdued">
                No results
              </EuiText>
            );
          }

          const itemId = this.getItemId(item);
          const isExpanded = openResultPopoverId === itemId;

          return (
            <EuiSmallButton
              size="s"
              iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
              iconSide="left"
              onClick={() => this.toggleResultsPopover(itemId)}
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Hide results' : 'View query results'}
            </EuiSmallButton>
          );
        },
      },
    ];

    const pagination = {
      pageIndex: page,
      pageSize: pageSizeToUse,
      totalItemCount: totalAlerts,
      pageSizeOptions: [5, 10, 20, 50],
    };

    const sorting = {
      sort: {
        direction: sortDirection,
        field: sortField,
      },
    };

    const expandedRowMap = displayedAlerts.reduce((acc, alert) => {
      const itemId = this.getItemId(alert);
      if (openResultPopoverId === itemId) {
        acc[itemId] = (
          <div style={{ padding: '12px 24px' }}>{this.renderQueryResultsPreview(alert)}</div>
        );
      }
      return acc;
    }, {});

    const stateSelectValue = alertState && alertState !== 'ALL' ? alertState : 'ALL';

    const stateOptions = [
      { value: 'ALL', text: 'All alerts' },
      { value: ALERT_STATE.ACTIVE, text: 'Active' },
      { value: ALERT_STATE.ERROR, text: 'Error' },
    ];

    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size="s">
              <strong>Trigger name</strong>
              <p>{trigger_name}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">
              <strong>Severity</strong>
              <p>{severityDisplay}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="xxl" />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size="s">
              <strong>Trigger start time</strong>
              <p>{getTime(start_time)}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size="xxl" />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size="s">
              <strong>Monitor</strong>
              <p>
                <EuiLink href={monitorUrl}>{monitor_name}</EuiLink>
              </p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiHorizontalRule margin="xxl" />

        <EuiText size="s">
          <strong>Query</strong>
          <p style={{ whiteSpace: 'pre-wrap' }}>{condition}</p>
        </EuiText>

        <EuiSpacer size="xxl" />
        <EuiHorizontalRule margin="none" />
        <EuiSpacer size="l" />

        <EuiFlexGroup style={{ padding: '0px 0px 16px' }} gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiCompressedSelect
              options={stateOptions}
              value={stateSelectValue}
              onChange={this.handleAlertStateChange}
              data-test-subj={'dashboardAlertStateFilter'}
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiBasicTable
          items={displayedAlerts}
          itemId={this.getItemId}
          columns={columns}
          loading={loading}
          pagination={pagination}
          sorting={sorting}
          onChange={this.handleTableChange}
          noItemsMessage={loading ? 'Loading alerts...' : 'No alerts.'}
          itemIdToExpandedRowMap={expandedRowMap}
          isExpandable={true}
        />
      </div>
    );
  }
}
