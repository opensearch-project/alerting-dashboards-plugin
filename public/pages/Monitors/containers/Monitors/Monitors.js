/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import queryString from 'query-string';
import { 
  EuiBasicTable, 
  EuiButtonGroup,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
} from '@elastic/eui';
import AcknowledgeModal from '../../components/AcknowledgeModal';
import ContentPanel from '../../../../components/ContentPanel';
import MonitorActions from '../../components/MonitorActions';
import MonitorControls from '../../components/MonitorControls';
import MonitorEmptyPrompt from '../../components/MonitorEmptyPrompt';
import { DEFAULT_PAGE_SIZE_OPTIONS, DEFAULT_QUERY_PARAMS } from './utils/constants';
import { getURLQueryParams } from './utils/helpers';
import { columns as staticColumns } from './utils/tableUtils';
import { MONITOR_ACTIONS, MONITOR_TYPE } from '../../../../utils/constants';
import { backendErrorNotification, deleteMonitor } from '../../../../utils/helpers';
import { displayAcknowledgedAlertsToast } from '../../../Dashboard/utils/helpers';
import { DeleteMonitorModal } from '../../../../components/DeleteModal/DeleteMonitorModal';
import {
  getDataSourceQueryObj,
  isDataSourceChanged,
  getDataSourceId,
} from '../../../utils/helpers';
import { getUseUpdatedUx } from '../../../../services';

const MAX_MONITOR_COUNT = 1000;

// TODO: Abstract out a Table component to be used in both Dashboard and Monitors

export default class Monitors extends Component {
  constructor(props) {
    super(props);
    const { from, size, search, sortField, sortDirection, state } = getURLQueryParams(
      this.props.location
    );

    // Initialize viewMode from localStorage, default to 'new'
    let initialViewMode = 'new';
    try {
      const stored = localStorage.getItem('alerting_monitors_view_mode');
      if (stored === 'classic' || stored === 'new') {
        initialViewMode = stored;
      }
    } catch (e) {
      console.error('Error reading viewMode from localStorage:', e);
    }

    this.state = {
      alerts: [],
      totalAlerts: 0,
      totalMonitors: 0,
      page: Math.floor(from / size),
      size,
      search,
      sortField,
      sortDirection,
      selectedItems: [],
      isPopoverOpen: false,
      monitors: [],
      monitorState: state,
      loadingMonitors: true,
      monitorItemsToDelete: undefined,
      viewMode: initialViewMode, // 'new' or 'classic' - initialized from localStorage
    };
    this.getMonitors = _.debounce(this.getMonitors.bind(this), 500, { leading: true });
    this.onTableChange = this.onTableChange.bind(this);
    this.onMonitorStateChange = this.onMonitorStateChange.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.updateMonitor = this.updateMonitor.bind(this);
    this.updateMonitors = this.updateMonitors.bind(this);
    this.deleteMonitors = this.deleteMonitors.bind(this);
    this.onClickAcknowledge = this.onClickAcknowledge.bind(this);
    this.onClickAcknowledgeModal = this.onClickAcknowledgeModal.bind(this);
    this.onClickEdit = this.onClickEdit.bind(this);
    this.onClickEnable = this.onClickEnable.bind(this);
    this.onClickDelete = this.onClickDelete.bind(this);
    this.onClickDisable = this.onClickDisable.bind(this);
    this.onBulkAcknowledge = this.onBulkAcknowledge.bind(this);
    this.onBulkEnable = this.onBulkEnable.bind(this);
    this.onBulkDelete = this.onBulkDelete.bind(this);
    this.onBulkDisable = this.onBulkDisable.bind(this);
    this.onPageClick = this.onPageClick.bind(this);
    this.getActiveAlerts = this.getActiveAlerts.bind(this);
    this.onClickCancel = this.onClickCancel.bind(this);
    this.resetFilters = this.resetFilters.bind(this);

    // Columns configuration - will be built dynamically based on viewMode
    this.buildColumns = this.buildColumns.bind(this);
  }

  // Build columns based on view mode
  buildColumns() {
    const { viewMode } = this.state;
    
    // In "New" mode, hide certain columns
    // In "Classic" mode, show all columns
    const HIDDEN_COLS = viewMode === 'new' ? new Set([
      'Active',
      'Acknowledged',
      'Errors',
      'Ignored',
      'Associations with composite monitors',
    ]) : new Set();
    
    return [
      ...staticColumns.filter((c) => !HIDDEN_COLS.has(c.name)),
      {
        name: 'Actions',
        width: '60px',
        actions: [
          {
            name: 'Acknowledge',
            description: 'Acknowledge this Monitor',
            onClick: this.onClickAcknowledge,
          },
          {
            name: 'Enable',
            description: 'Enable this Monitor',
            onClick: this.onClickEnable,
            available: (item) => !item.enabled,
          },
          {
            name: 'Disable',
            description: 'Disable this Monitor',
            onClick: this.onClickDisable,
            available: (item) => item.enabled,
          },
          {
            name: 'Delete',
            description: 'Delete this Monitor',
            onClick: this.onClickDelete,
          },
        ],
      },
    ];
  }

  componentDidMount() {
    const { page, size, search, sortField, sortDirection, monitorState } = this.state;
    this.getMonitors(page * size, size, search, sortField, sortDirection, monitorState);
  }

  componentDidUpdate(prevProps, prevState) {
    const prevQuery = this.getQueryObjectFromState(prevState);
    const currQuery = this.getQueryObjectFromState(this.state);
    if (!_.isEqual(prevQuery, currQuery)) {
      this.updateMonitorList();
    }
    if (isDataSourceChanged(prevProps, this.props)) {
      this.updateMonitorList();
    }
    // Refresh monitors when view mode changes
    if (prevState.viewMode !== this.state.viewMode) {
      this.updateMonitorList();
    }
  }

  updateMonitorList() {
    const { page, size, search, sortField, sortDirection, monitorState } = this.state;
    this.getMonitors(page * size, size, search, sortField, sortDirection, monitorState);
  }

  getQueryObjectFromState({ page, size, search, sortField, sortDirection, monitorState }) {
    return {
      page,
      size,
      search,
      sortField,
      sortDirection,
      monitorState,
    };
  }

  async getMonitors(from, size, search, sortField, sortDirection, state) {
    this.setState({ loadingMonitors: true });
    try {
      const dataSourceId = getDataSourceId();
      const params = { from, size, search, sortField, sortDirection, state, dataSourceId };
      const queryParamsString = queryString.stringify(params);
      const { httpClient, history } = this.props;
      history.replace({ ...this.props.location, search: queryParamsString });
      const extendedParams = {
        ...(dataSourceId !== undefined && { dataSourceId }), // Only include dataSourceId if it exists
        ...params, // Other parameters
      };
      
      // Call different API based on view mode
      const { viewMode } = this.state;
      const apiPath = viewMode === 'classic' 
        ? '../api/alerting/monitors/v1'  // v1 API for classic view
        : '../api/alerting/monitors';     // v2 API for new view
      
      const response = await httpClient.get(apiPath, { query: extendedParams });
      if (response.ok) {
        let monitors = [];
        let totalMonitors = 0;

        if (response.hits && Array.isArray(response.hits.hits)) {
          const hits = response.hits.hits;
          const now = Date.now();
          monitors = hits.map((h) => {
            const srcMon = h?._source?.monitor || h?._source || {};
            const ppl = srcMon?.ppl_monitor || {};
            const name =
              (typeof ppl.name === 'string' && ppl.name) ||
              (typeof srcMon.name === 'string' && srcMon.name) ||
              h._id ||
              '';
            const enabled =
              typeof ppl.enabled === 'boolean'
                ? ppl.enabled
                : Boolean(srcMon.enabled);
            return {
              id: h._id,
              name,
              enabled,
              monitor: srcMon,
              ifSeqNo: h._seq_no,
              ifPrimaryTerm: h._primary_term,
              item_type:
                srcMon.workflow_type ||
                srcMon.monitor_type ||
                MONITOR_TYPE.QUERY_LEVEL,
              associatedCompositeMonitorCnt: 0,
              currentTime: now,
            };
          });
          totalMonitors = Number(response.hits?.total?.value ?? monitors.length) || 0;
        } else if (Array.isArray(response.monitors)) {
          const now = Date.now();
          monitors = response.monitors.map((m) => {
            const srcMon = m?.monitor || {};
            const ppl = srcMon?.ppl_monitor || {};
            const name =
              (typeof ppl.name === 'string' && ppl.name) ||
              (typeof m.name === 'string' && m.name) ||
              m.id;
            const enabled =
              typeof ppl.enabled === 'boolean'
                ? ppl.enabled
                : Boolean(m.enabled);
            return {
              id: m.id,
              name,
              enabled,
              monitor: srcMon,
              ifSeqNo: m.ifSeqNo,
              ifPrimaryTerm: m.ifPrimaryTerm,
              item_type:
                srcMon.monitor_type ||
                m.item_type ||
                MONITOR_TYPE.QUERY_LEVEL,
              associatedCompositeMonitorCnt: m.associatedCompositeMonitorCnt || 0,
              currentTime: now,
            };
          });
          totalMonitors = Number(response.totalMonitors ?? monitors.length) || 0;
        }

        this.setState({ monitors, totalMonitors });
      } else {
        if (dataSourceId !== undefined) {
          this.setState({ monitors: [], totalMonitors: 0 });
        }
        console.log('error getting monitors:', response);
        // TODO: 'response.ok' is 'false' when there is no alerting config index in the cluster, and notification should not be shown to new Alerting users
        // backendErrorNotification(notifications, 'get', 'monitors', response.resp);
      }
    } catch (err) {
      console.error(err);
    }
    this.setState({ loadingMonitors: false });
  }

  onTableChange({ page: tablePage = {}, sort = {} }) {
    const { index: page, size } = tablePage;
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({ page, size, sortField, sortDirection });
  }

  onMonitorStateChange(e) {
    this.setState({ page: 0, monitorState: e.target.value });
  }

  onSelectionChange(selectedItems) {
    this.setState({ selectedItems });
  }

  onSearchChange(e) {
    this.setState({ page: 0, search: e.target.value });
  }

  async updateMonitor(item, update) {
    const { httpClient, notifications } = this.props;
    const dataSourceQuery = getDataSourceQueryObj();

    try {
      const detailResp = await httpClient.get(
        `../api/alerting/monitors/${item.id}`,
        dataSourceQuery
      );

      if (!detailResp?.ok) {
        backendErrorNotification(notifications, 'get', 'monitor', detailResp?.resp);
        return detailResp;
      }

      const monitorDetail = detailResp.resp || {};
      const ifSeqNo = detailResp.ifSeqNo ?? item.ifSeqNo;
      const ifPrimaryTerm = detailResp.ifPrimaryTerm ?? item.ifPrimaryTerm;
      const dataSourceId = getDataSourceId();

      const isPplMonitor = Boolean(
        _.get(monitorDetail, 'monitor_v2.ppl_monitor') ||
          _.get(monitorDetail, 'monitorV2.ppl_monitor') ||
          monitorDetail?.ppl_monitor ||
          monitorDetail?.monitor_mode === 'ppl' ||
          monitorDetail?.monitorMode === 'ppl' ||
          (typeof monitorDetail?.query_language === 'string' &&
            monitorDetail.query_language.toLowerCase() === 'ppl') ||
          (typeof monitorDetail?.queryLanguage === 'string' &&
            monitorDetail.queryLanguage.toLowerCase() === 'ppl')
      );

      const query = {};
      if (ifSeqNo !== undefined) query.ifSeqNo = ifSeqNo;
      if (ifPrimaryTerm !== undefined) query.ifPrimaryTerm = ifPrimaryTerm;
      if (dataSourceId !== undefined) query.dataSourceId = dataSourceId;

      if (isPplMonitor) {
        const basePplMonitor = _.cloneDeep(
          _.get(monitorDetail, 'monitor_v2.ppl_monitor') ||
            _.get(monitorDetail, 'monitorV2.ppl_monitor') ||
            monitorDetail?.ppl_monitor ||
            monitorDetail ||
            {}
        );

        const cleanedPplMonitor = _.omit(
          { ...basePplMonitor, ...update },
          ['id', '_id', 'item_type', 'monitor_type', 'version', '_version', 'ifSeqNo', 'ifPrimaryTerm']
        );

        if (Array.isArray(cleanedPplMonitor.triggers)) {
          cleanedPplMonitor.triggers = cleanedPplMonitor.triggers.map((trigger) =>
            _.omit(trigger, ['id', 'last_triggered_time', 'last_execution_time'])
          );
        }

        return httpClient
          .put(`../api/alerting/monitors/${item.id}`, {
            query,
            body: JSON.stringify({ monitor_mode: 'ppl', ppl_monitor: cleanedPplMonitor }),
          })
          .then((resp) => {
            if (!resp.ok) {
              backendErrorNotification(notifications, 'update', 'monitor', resp.resp);
            }
            return resp;
          })
          .catch((err) => err);
      }

      const legacyPayload = _.omit(
        { ...monitorDetail, ...update },
        ['id', '_id', 'item_type', 'currentTime', 'version', '_version', 'ifSeqNo', 'ifPrimaryTerm']
      );

      return httpClient
        .put(`../api/alerting/monitors/${item.id}`, {
          query,
          body: JSON.stringify(legacyPayload),
        })
        .then((resp) => {
          if (!resp.ok) {
            backendErrorNotification(notifications, 'update', 'monitor', resp.resp);
          }
          return resp;
        })
        .catch((err) => err);
    } catch (err) {
      return err;
    }
  }

  async updateMonitors(items, update) {
    const arrayOfPromises = items.map((item) =>
      this.updateMonitor(item, update).catch((error) => error)
    );

    return Promise.all(arrayOfPromises).then((values) => {
      // TODO: Show which values failed, succeeded, etc.
      const { page, size, search, sortField, sortDirection, monitorState } = this.state;
      this.getMonitors(page * size, size, search, sortField, sortDirection, monitorState);
      this.setState({ selectedItems: [] });
    });
  }

  async deleteMonitors(items) {
    const { httpClient, notifications } = this.props;
    
    const arrayOfPromises = items.map((item) =>
      deleteMonitor(item, httpClient, notifications, getDataSourceQueryObj()).catch(
        (error) => error
      )
    );

    await Promise.all(arrayOfPromises);
    // TODO: Show which values failed, succeeded, etc.
    const { page, size, search, sortField, sortDirection, monitorState } = this.state;
    await this.getMonitors(page * size, size, search, sortField, sortDirection, monitorState);
    this.setState({ selectedItems: [] });
  }

  async onClickAcknowledge(item) {
    await this.getActiveAlerts([item]);
  }

  async onClickAcknowledgeModal(alerts) {
    const { httpClient, notifications } = this.props;

    const monitorAlerts = alerts.reduce((monitorAlerts, alert) => {
      const { id, monitor_id, workflow_id, alert_source } = alert;
      const monitorId = workflow_id || monitor_id;
      if (monitorAlerts[monitorId]) monitorAlerts[monitorId].ids.push(id);
      else monitorAlerts[monitorId] = { ids: [id], alert_source };
      return monitorAlerts;
    }, {});

    const promises = Object.entries(monitorAlerts).map(([monitorId, { ids, alert_source }]) => {
      const poolType = alert_source === 'workflow' ? 'workflows' : 'monitors';
      httpClient
        .post(`../api/alerting/${poolType}/${monitorId}/_acknowledge/alerts`, {
          body: JSON.stringify({ alerts: ids }),
          query: getDataSourceQueryObj()?.query,
        })
        .then((resp) => {
          if (!resp.ok) {
            backendErrorNotification(notifications, 'acknowledge', 'alert', resp.resp);
          } else {
            const successfulCount = _.get(resp, 'resp.success', []).length;
            displayAcknowledgedAlertsToast(notifications, successfulCount);
          }
        })
        .catch((error) => error);
    });

    const values = await Promise.all(promises);
    // TODO: Show which values failed, succeeded, etc.
    const { page, size, search, sortField, sortDirection, monitorState } = this.state;
    this.getMonitors(page * size, size, search, sortField, sortDirection, monitorState);
    this.setState({ alerts: [], totalAlerts: 0, showAcknowledgeModal: false, selectedItems: [] });
  }

  onClickEdit() {
    const {
      selectedItems: [{ id }],
    } = this.state;
    if (id) this.props.history.push(`/monitors/${id}?action=${MONITOR_ACTIONS.EDIT_MONITOR}`);
  }

  onClickEnable(item) {
    this.updateMonitors([item], { enabled: true });
  }

  onClickDelete(item) {
    this.setState({
      monitorItemsToDelete: [item],
    });
  }

  onClickDisable(item) {
    this.updateMonitors([item], { enabled: false });
  }

  async onBulkAcknowledge() {
    await this.getActiveAlerts(this.state.selectedItems);
  }

  onBulkEnable() {
    this.updateMonitors(this.state.selectedItems, { enabled: true });
  }

  onBulkDelete() {
    this.setState({ monitorItemsToDelete: this.state.selectedItems });
  }

  onBulkDisable() {
    this.updateMonitors(this.state.selectedItems, { enabled: false });
  }

  onPageClick(page) {
    this.setState({ page });
  }

  async getActiveAlerts(selectedItems) {
    const monitorIds = selectedItems
      .filter((item) => item.item_type !== MONITOR_TYPE.COMPOSITE_LEVEL)
      .map((monitor) => monitor.id);
    const workflowIds = selectedItems
      .filter((item) => item.item_type === MONITOR_TYPE.COMPOSITE_LEVEL)
      .map((monitor) => monitor.id);
    if (!monitorIds.length && !workflowIds.length) return;
    // TODO: Limiting to 100.. otherwise could be bringing back large amount of alerts that all need to be acknowledged 1 by 1, handle case when there are more than 100 on UI
    const params = {
      from: 0,
      size: 100,
      sortField: 'monitor_name',
      sortDirection: 'asc',
      alertState: 'ACTIVE',
      monitorIds,
    };

    const { httpClient, notifications } = this.props;
    let allAlerts = [];
    let totalAlertsCount = 0;

    const dataSourceId = getDataSourceId();
    const extendedParams = {
      ...(dataSourceId !== undefined && { dataSourceId }), // Only include dataSourceId if it exists
      ...params, // Other parameters
    };

    if (monitorIds.length > 0) {
      const monitorAlertsResponse = await httpClient.get('../api/alerting/alerts', {
        query: extendedParams,
      });
      if (!monitorAlertsResponse.ok) {
        console.error(monitorAlertsResponse);
        backendErrorNotification(notifications, 'get', 'alerts', monitorAlertsResponse.err);
      } else {
        const { alerts, totalAlerts } = monitorAlertsResponse;
        allAlerts = allAlerts.concat(alerts);
        totalAlertsCount += totalAlerts;
      }
    }

    if (workflowIds.length > 0) {
      const chainedAlertsResponse = await httpClient.get('../api/alerting/alerts', {
        query: {
          ...extendedParams,
          monitorIds: workflowIds,
          monitorType: MONITOR_TYPE.COMPOSITE_LEVEL,
        },
      });

      if (!chainedAlertsResponse.ok) {
        console.error(chainedAlertsResponse);
        backendErrorNotification(notifications, 'get', 'alerts', chainedAlertsResponse.err);
      } else {
        const { alerts, totalAlerts } = chainedAlertsResponse;
        allAlerts = allAlerts.concat(alerts);
        totalAlertsCount += totalAlerts;
      }
    }

    this.setState({
      alerts: allAlerts,
      totalAlerts: totalAlertsCount,
      showAcknowledgeModal: true,
    });
  }

  onClickCancel() {
    this.setState({ showAcknowledgeModal: false });
  }

  resetFilters() {
    this.setState({
      search: DEFAULT_QUERY_PARAMS.search,
      monitorState: DEFAULT_QUERY_PARAMS.state,
    });
  }

  getItemId(item) {
    return `${item.id}-${item.currentTime}`;
  }

  isDeleteNotSupported = (items) => {
    return items.length > 1 && items.some((item) => item.associatedCompositeMonitorCnt > 0);
  };

  render() {
    const {
      alerts,
      monitors,
      monitorState,
      page,
      search,
      selectedItems,
      showAcknowledgeModal,
      size,
      sortDirection,
      sortField,
      totalAlerts,
      totalMonitors,
      loadingMonitors,
      monitorItemsToDelete,
    } = this.state;
    const filterIsApplied = !!search || monitorState !== DEFAULT_QUERY_PARAMS.state;

    const pagination = {
      pageIndex: page,
      pageSize: size,
      pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
      totalItemCount: Math.min(MAX_MONITOR_COUNT, totalMonitors),
    };

    const sorting = {
      sort: {
        direction: sortDirection,
        field: sortField,
      },
    };

    const selection = {
      onSelectionChange: this.onSelectionChange,
      selectableMessage: (selectable) => (selectable ? undefined : undefined),
    };

    const useUpdatedUx = getUseUpdatedUx();
    const { viewMode } = this.state;
    
    const monitorActions = (
      <MonitorActions
        isEditDisabled={selectedItems.length !== 1}
        isDeleteDisabled={selectedItems.length === 0 || this.isDeleteNotSupported(selectedItems)}
        onBulkAcknowledge={this.onBulkAcknowledge}
        onBulkEnable={this.onBulkEnable}
        onBulkDisable={this.onBulkDisable}
        onBulkDelete={this.onBulkDelete}
        onClickEdit={this.onClickEdit}
        viewMode={viewMode}
      />
    );

    const toggleButtons = [
      {
        id: 'new',
        label: 'New',
      },
      {
        id: 'classic',
        label: 'Classic',
      },
    ];

    return (
      <>
        <ContentPanel
          actions={useUpdatedUx ? undefined : monitorActions}
          bodyStyles={{ padding: 'initial' }}
          title={useUpdatedUx ? undefined : 'Monitors'}
          panelOptions={{ hideTitleBorder: useUpdatedUx }}
          panelStyles={{ padding: useUpdatedUx ? '0px' : '16px' }}
        >
          {useUpdatedUx && (
            <>
              <div style={{ padding: '16px 16px 0px 16px' }}>
                <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup alignItems="center" gutterSize="m" responsive={false}>
                      <EuiFlexItem grow={false}>
                        <EuiTitle size="l">
                          <h1>Monitors</h1>
                        </EuiTitle>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonGroup
                          legend="Monitor view toggle"
                          options={toggleButtons}
                          idSelected={viewMode}
                          onChange={(id) => {
                            this.setState({ viewMode: id });
                            // Persist viewMode to localStorage so MonitorDetails can use it
                            try {
                              localStorage.setItem('alerting_monitors_view_mode', id);
                            } catch (e) {
                              console.error('Error saving viewMode to localStorage:', e);
                            }
                          }}
                          buttonSize="compressed"
                          color="text"
                          isFullWidth={false}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    {monitorActions}
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>
              <EuiSpacer size="m" />
            </>
          )}
          <MonitorControls
            activePage={page}
            pageCount={Math.ceil(totalMonitors / size) || 1}
            search={search}
            state={monitorState}
            onSearchChange={this.onSearchChange}
            onStateChange={this.onMonitorStateChange}
            onPageClick={this.onPageClick}
            monitorActions={null}
          />

          {showAcknowledgeModal && (
            <AcknowledgeModal
              alerts={alerts}
              totalAlerts={totalAlerts}
              onAcknowledge={this.onClickAcknowledgeModal}
              onClickCancel={this.onClickCancel}
            />
          )}

          <div style={{ padding: useUpdatedUx ? '0px 16px 16px 16px' : '0px' }}>
            <EuiBasicTable
              columns={this.buildColumns()}
              hasActions={true}
              isSelectable={true}
              /*
               * EUI doesn't let you manually control the selectedItems, so we have to use the itemId for now
               * If using monitor ID, doesn't correctly update selectedItems when doing certain bulk actions, because the ID is the same
               * If using monitor ID + monitor version, it works for everything except Acknowledge, because Acknowledge isn't updating the monitor document
               * So the best approach for now is to set a currentTime on API response for the table to use as part of itemId,
               * and whenever new monitors are fetched from the server, we should be deselecting all monitors
               * */
              itemId={this.getItemId}
              items={monitors}
              noItemsMessage={
                <MonitorEmptyPrompt
                  filterIsApplied={filterIsApplied}
                  loading={loadingMonitors}
                  resetFilters={this.resetFilters}
                />
              }
              onChange={this.onTableChange}
              pagination={pagination}
              selection={selection}
              sorting={sorting}
            />
          </div>
        </ContentPanel>
        {monitorItemsToDelete && (
          <DeleteMonitorModal
            monitors={monitorItemsToDelete}
            httpClient={this.props.httpClient}
            closeDeleteModal={() => this.setState({ monitorItemsToDelete: undefined })}
            onClickDelete={async () => {
              await this.deleteMonitors(this.state.monitorItemsToDelete);
            }}
          />
        )}
      </>
    );
  }
}
