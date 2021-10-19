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
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React, { Component } from 'react';
import _ from 'lodash';
import queryString from 'query-string';
import { EuiBasicTable, EuiButton, EuiHorizontalRule, EuiIcon } from '@elastic/eui';
import ContentPanel from '../../../components/ContentPanel';
import DashboardEmptyPrompt from '../components/DashboardEmptyPrompt';
import DashboardControls from '../components/DashboardControls';
import { alertColumns, queryColumns } from '../utils/tableUtils';
import {
  ALERT_STATE,
  MONITOR_TYPE,
  OPENSEARCH_DASHBOARDS_AD_PLUGIN,
} from '../../../utils/constants';
import { backendErrorNotification } from '../../../utils/helpers';
import {
  displayAcknowledgedAlertsToast,
  filterActiveAlerts,
  getInitialSize,
  getQueryObjectFromState,
  getURLQueryParams,
  groupAlertsByTrigger,
  insertGroupByColumn,
} from '../utils/helpers';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../../Monitors/containers/Monitors/utils/constants';
import { MAX_ALERT_COUNT } from '../utils/constants';

// TODO: Abstract out a Table component to be used in both Dashboard and Monitors

export default class Dashboard extends Component {
  constructor(props) {
    super(props);

    const { location, perAlertView } = props;

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
      alertsByTriggers: [],
      alertState,
      flyoutIsOpen: false,
      loadingMonitors: true,
      monitors: [],
      monitorIds: this.props.monitorIds,
      page: Math.floor(from / size),
      search,
      selectedItems: [],
      severityLevel,
      size: getInitialSize(perAlertView, size),
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
          this.setState({
            alerts,
            totalAlerts,
          });

          if (!perAlertView) {
            const alertsByTriggers = groupAlertsByTrigger(alerts);
            this.setState({
              totalTriggers: alertsByTriggers.length,
              alertsByTriggers,
            });
            this.getMonitors();
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

  async getMonitors() {
    const { httpClient } = this.props;
    const { alertsByTriggers } = this.state;
    this.setState({ ...this.state, loadingMonitors: true });
    const monitorIds = alertsByTriggers.map((alert) => alert.monitor_id);
    let monitors;
    try {
      const params = {
        query: {
          query: {
            ids: {
              values: monitorIds,
            },
          },
        },
      };
      const response = await httpClient.post('../api/alerting/monitors/_search', {
        body: JSON.stringify(params),
      });
      if (response.ok) {
        monitors = _.get(response, 'resp.hits.hits', []);
      } else {
        console.log('error getting monitors:', response);
      }
    } catch (err) {
      console.error(err);
    }
    this.setState({ ...this.state, loadingMonitors: false, monitors: monitors });
  }

  // TODO: exists in both Dashboard and Monitors, should be moved to redux when implemented
  acknowledgeAlert = async () => {
    const { selectedItems } = this.state;
    const { httpClient, notifications, perAlertView } = this.props;

    if (!selectedItems.length) return;

    let selectedAlerts = perAlertView ? selectedItems : _.get(selectedItems, '0.alerts', []);
    selectedAlerts = filterActiveAlerts(selectedAlerts);

    const monitorAlerts = selectedAlerts.reduce((monitorAlerts, alert) => {
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
          } else {
            const successfulCount = _.get(resp, 'resp.success', []).length;
            displayAcknowledgedAlertsToast(notifications, successfulCount);
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
    this.setState({ page, size, sortField, sortDirection });
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

  openFlyout = (payload) => {
    this.setState({ ...this.state, flyoutIsOpen: true });
    this.props.setFlyout({
      type: 'alertsDashboard',
      payload: { ...payload },
    });
  };

  closeFlyout = () => {
    this.props.setFlyout(null);
    this.setState({ ...this.state, flyoutIsOpen: false });
  };

  refreshDashboard = () => {
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
  };

  render() {
    const {
      alerts,
      alertsByTriggers,
      alertState,
      loadingMonitors,
      monitors,
      page,
      search,
      selectedItems,
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
      setFlyout,
      httpClient,
      location,
      history,
      notifications,
      isAlertsFlyout = false,
    } = this.props;
    let totalItems = perAlertView ? totalAlerts : totalTriggers;
    const isBucketMonitor = monitorType === MONITOR_TYPE.BUCKET_LEVEL;

    let columnType = perAlertView
      ? isBucketMonitor
        ? insertGroupByColumn(groupBy)
        : queryColumns
      : alertColumns(
          history,
          httpClient,
          loadingMonitors,
          location,
          monitors,
          notifications,
          setFlyout,
          this.openFlyout,
          this.closeFlyout,
          this.refreshDashboard
        );

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
      selectable: perAlertView
        ? (item) => item.state === ALERT_STATE.ACTIVE
        : (item) => item.ACTIVE > 0,
      selectableMessage: perAlertView
        ? (selectable) => (selectable ? undefined : 'Only active alerts can be acknowledged.')
        : (selectable) => (selectable ? undefined : 'Only active alerts can be acknowledged.'),
    };

    const actions = () => {
      // The acknowledge button is disabled when viewing by per alerts, and no item selected or per trigger view and item selected is not 1.
      const actions = [
        <EuiButton
          onClick={this.acknowledgeAlert}
          disabled={perAlertView ? !selectedItems.length : selectedItems.length !== 1}
        >
          Acknowledge
        </EuiButton>,
      ];

      if (!perAlertView) {
        const alert = selectedItems[0];
        actions.unshift(
          <EuiButton
            onClick={() => {
              this.openFlyout({
                ...alert,
                history,
                httpClient,
                loadingMonitors,
                location,
                monitors,
                notifications,
                setFlyout,
                closeFlyout: this.closeFlyout,
                refreshDashboard: this.refreshDashboard,
              });
            }}
            disabled={selectedItems.length !== 1}
          >
            View alert details
          </EuiButton>
        );
      }

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
      if (perAlertView) return isBucketMonitor ? item.id : `${item.id}-${item.version}`;
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
          isAlertsFlyout={isAlertsFlyout}
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
          pagination={perAlertView ? pagination : undefined}
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
