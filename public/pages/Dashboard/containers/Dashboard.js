/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React, { Component } from 'react';
import _ from 'lodash';
import queryString from 'query-string';
import { EuiBasicTable, EuiButton, EuiHorizontalRule, EuiIcon } from '@elastic/eui';

import ContentPanel from '../../../components/ContentPanel';
import DashboardEmptyPrompt from '../components/DashboardEmptyPrompt';
import DashboardControls from '../components/DashboardControls';
import { columns, alertColumns, bucketColumns, queryColumns } from '../utils/tableUtils';
import { MONITOR_TYPE, OPENSEARCH_DASHBOARDS_AD_PLUGIN } from '../../../utils/constants';
import { backendErrorNotification } from '../../../utils/helpers';
import { groupAlertsByTrigger, insertGroupByColumn } from '../utils/helpers';

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const DEFAULT_QUERY_PARAMS = {
  alertState: 'ALL',
  from: 0,
  search: '',
  severityLevel: 'ALL',
  size: 20,
  sortDirection: 'desc',
  sortField: 'start_time',
};

const MAX_ALERT_COUNT = 10000;

// TODO: Abstract out a Table component to be used in both Dashboard and Monitors

export default class Dashboard extends Component {
  constructor(props) {
    super(props);

    const {
      alertState,
      from,
      search,
      severityLevel,
      size,
      sortDirection,
      sortField,
    } = this.getURLQueryParams();

    this.state = {
      alerts: [],
      alertsByTriggers: [],
      alertState,
      monitorIds: this.props.monitorIds,
      page: Math.floor(from / size),
      search,
      selectedItems: [],
      severityLevel,
      size,
      sortDirection,
      sortField,
      totalAlerts: 0,
      totalTriggers: 0,
    };
  }

  static defaultProps = {
    monitorIds: [],
    detectorIds: [],
  };

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
    const prevQuery = this.getQueryObjectFromState(prevState);
    const currQuery = this.getQueryObjectFromState(this.state);
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

  getQueryObjectFromState = ({
    page,
    size,
    search,
    sortField,
    sortDirection,
    severityLevel,
    alertState,
    monitorIds,
  }) => ({
    page,
    size,
    search,
    sortField,
    sortDirection,
    severityLevel,
    alertState,
    monitorIds,
  });

  getURLQueryParams = () => {
    const {
      from = DEFAULT_QUERY_PARAMS.from,
      size = DEFAULT_QUERY_PARAMS.size,
      search = DEFAULT_QUERY_PARAMS.search,
      sortField = DEFAULT_QUERY_PARAMS.sortField,
      sortDirection = DEFAULT_QUERY_PARAMS.sortDirection,
      severityLevel = DEFAULT_QUERY_PARAMS.severityLevel,
      alertState = DEFAULT_QUERY_PARAMS.alertState,
      monitorIds = this.props.monitorIds,
    } = queryString.parse(this.props.location.search);

    return {
      from: isNaN(parseInt(from, 10)) ? DEFAULT_QUERY_PARAMS.from : parseInt(from, 10),
      size: isNaN(parseInt(size, 10)) ? DEFAULT_QUERY_PARAMS.size : parseInt(size, 10),
      search,
      sortField,
      sortDirection,
      severityLevel,
      alertState,
      monitorIds,
    };
  };

  getAlerts = _.debounce(
    (from, size, search, sortField, sortDirection, severityLevel, alertState, monitorIds) => {
      const params = {
        from,
        size,
        search,
        sortField,
        sortDirection,
        severityLevel,
        alertState,
        monitorIds,
      };
      const queryParamsString = queryString.stringify(params);
      location.search;
      const { httpClient, history, notifications, perAlertView } = this.props;
      history.replace({ ...this.props.location, search: queryParamsString });
      httpClient.get('../api/alerting/alerts', { query: params }).then((resp) => {
        if (resp.ok) {
          const { alerts, totalAlerts } = resp;
          const alertsByTriggers = groupAlertsByTrigger(alerts);
          this.setState({
            alerts,
            totalAlerts,
            totalTriggers: alertsByTriggers.length,
            alertsByTriggers,
          });
          if (!perAlertView) {
            const alertsByTriggers = groupAlertsByTrigger(alerts);
            this.setState({
              totalTriggers: alertsByTriggers.length,
              alertsByTriggers,
            });
          }
        } else {
          console.log('error getting alerts:', resp);
          backendErrorNotification(notifications, 'get', 'alerts', resp.err);
        }
      });
    },
    500,
    { leading: true }
  );

  // TODO: exists in both Dashboard and Monitors, should be moved to redux when implemented
  acknowledgeAlert = async () => {
    const { selectedItems } = this.state;
    const { httpClient, notifications } = this.props;

    if (!selectedItems.length) return;

    const monitorAlerts = selectedItems.reduce((monitorAlerts, alert) => {
      const { id, monitor_id: monitorId } = alert;
      if (monitorAlerts[monitorId]) monitorAlerts[monitorId].push(id);
      else monitorAlerts[monitorId] = [id];
      return monitorAlerts;
    }, {});

    const promises = Object.entries(monitorAlerts).map(([monitorId, alerts]) =>
      httpClient
        .post(`../api/alerting/monitors/${monitorId}/_acknowledge/alerts`, {
          body: JSON.stringify({ alerts }),
        })
        .then((resp) => {
          if (!resp.ok) {
            backendErrorNotification(notifications, 'acknowledge', 'alert', resp.resp);
          }
        })
        .catch((error) => error)
    );

    const values = await Promise.all(promises);
    console.log('values:', values);
    // // TODO: Show which values failed, succeeded, etc.
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
    this.setState({ selectedItems: [] });
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
  };

  onSeverityLevelChange = (e) => {
    this.setState({ page: 0, severityLevel: e.target.value });
  };

  onAlertStateChange = (e) => {
    this.setState({ page: 0, alertState: e.target.value });
  };

  onSelectionChange = (selectedItems) => {
    this.setState({ selectedItems });
  };

  onSearchChange = (e) => {
    this.setState({ page: 0, search: e.target.value });
  };

  onPageClick = (page) => {
    this.setState({ page });
  };

  render() {
    const {
      alerts,
      alertsByTriggers,
      alertState,
      page,
      search,
      severityLevel,
      size,
      sortDirection,
      sortField,
      totalAlerts,
      totalTriggers,
    } = this.state;
    const {
      monitorIds,
      detectorIds,
      onCreateTrigger,
      perAlertView,
      monitorType,
      groupBy,
    } = this.props;
    const totalItems = perAlertView ? totalAlerts : totalTriggers;
    const isBucketMonitor = monitorType === MONITOR_TYPE.BUCKET_LEVEL;

    const columnType = perAlertView
      ? isBucketMonitor
        ? insertGroupByColumn(groupBy)
        : queryColumns
      : alertColumns;

    const pagination = {
      pageIndex: page,
      pageSize: size,
      totalItemCount: Math.min(MAX_ALERT_COUNT, totalItems),
      pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
    };

    const sorting = {
      sort: {
        direction: sortDirection,
        field: sortField,
      },
    };

    const selection = {
      onSelectionChange: this.onSelectionChange,
      selectable: (item) => item.state === 'ACTIVE',
      selectableMessage: (selectable) =>
        selectable ? undefined : 'Only Active Alerts are Acknowledgeable',
    };

    const actions = () => {
      const actions = [<EuiButton onClick={this.acknowledgeAlert}>Acknowledge</EuiButton>];
      if (detectorIds.length) {
        actions.unshift(
          <EuiButton
            href={`${OPENSEARCH_DASHBOARDS_AD_PLUGIN}#/detectors/${detectorIds[0]}`}
            target="_blank"
          >
            View detector <EuiIcon type="popout" />
          </EuiButton>
        );
      }
      return actions;
    };

    const getItemId = (item) => {
      if (perAlertView && isBucketMonitor) return item.id;
      return `${item.triggerID}-${item.version}`;
    };

    return (
      <ContentPanel
        title={perAlertView ? 'Alerts' : 'Alerts by triggers'}
        titleSize={monitorIds.length ? 's' : 'l'}
        bodyStyles={{ padding: 'initial' }}
        actions={actions()}
      >
        <DashboardControls
          activePage={page}
          pageCount={Math.ceil(totalItems / size) || 1}
          search={search}
          severity={severityLevel}
          state={alertState}
          onSearchChange={this.onSearchChange}
          onSeverityChange={this.onSeverityLevelChange}
          onStateChange={this.onAlertStateChange}
          onPageChange={this.onPageClick}
        />

        <EuiHorizontalRule margin="xs" />

        <EuiBasicTable
          items={perAlertView ? alerts : alertsByTriggers}
          /*
           * If using just ID, doesn't update selectedItems when doing acknowledge
           * because the next getAlerts have the same id
           * $id-$version will correctly remove selected items
           * */
          itemId={getItemId}
          columns={columnType}
          pagination={pagination}
          sorting={sorting}
          isSelectable={true}
          selection={selection}
          onChange={this.onTableChange}
          noItemsMessage={<DashboardEmptyPrompt onCreateTrigger={onCreateTrigger} />}
        />
      </ContentPanel>
    );
  }
}
