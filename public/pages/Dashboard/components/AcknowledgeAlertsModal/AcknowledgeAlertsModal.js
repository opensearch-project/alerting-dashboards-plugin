/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import queryString from 'query-string';
import PropTypes from 'prop-types';
import {
  EuiBasicTable,
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
} from '@elastic/eui';
import {
  ALERT_STATE,
  MONITOR_ACTIONS,
  MONITOR_GROUP_BY,
  MONITOR_INPUT_DETECTOR_ID,
  MONITOR_TYPE,
  OPENSEARCH_DASHBOARDS_AD_PLUGIN,
} from '../../../../utils/constants';
import {
  displayAcknowledgedAlertsToast,
  filterActiveAlerts,
  getQueryObjectFromState,
  getURLQueryParams,
  insertGroupByColumn,
  removeColumns,
} from '../../utils/helpers';
import { backendErrorNotification } from '../../../../utils/helpers';
import { MAX_ALERT_COUNT } from '../../utils/constants';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../../../Monitors/containers/Monitors/utils/constants';
import DashboardControls from '../DashboardControls';
import ContentPanel from '../../../../components/ContentPanel';
import { appendCommentsAction, queryColumns } from '../../utils/tableUtils';
import DashboardEmptyPrompt from '../DashboardEmptyPrompt';
import { getAlertsFindingColumn } from '../FindingsDashboard/findingsUtils';
import { getDataSourceId, getIsCommentsEnabled } from '../../../utils/helpers';

export const DEFAULT_NUM_MODAL_ROWS = 10;

export default class AcknowledgeAlertsModal extends Component {
  constructor(props) {
    super(props);
    const { location, monitor_id } = this.props;

    const { alertState, from, search, severityLevel, size, sortDirection, sortField } =
      getURLQueryParams(location);

    this.state = {
      alerts: [],
      alertState: alertState,
      flyoutIsOpen: false,
      loading: true,
      monitors: [],
      monitorIds: [monitor_id],
      page: Math.floor(from / size),
      search: search,
      selectedItems: [],
      severityLevel: severityLevel,
      size: DEFAULT_NUM_MODAL_ROWS,
      sortDirection: sortDirection,
      sortField: sortField,
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
    getIsCommentsEnabled(this.props.httpClient).then((commentsEnabled) => {
      this.setState({ commentsEnabled });
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
  }

  getAlerts = async () => {
    this.setState({ ...this.state, loading: true });
    const { from, search, sortField, sortDirection, severityLevel, alertState, monitorIds } =
      this.state;

    const { httpClient, history, notifications, triggerId } = this.props;

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

    const dataSourceId = getDataSourceId();
    const extendedParams = {
      ...(dataSourceId !== undefined && { dataSourceId }), // Only include dataSourceId if it exists
      ...params, // Other parameters
    };
    httpClient.get('../api/alerting/alerts', { query: extendedParams }).then((resp) => {
      if (resp.ok) {
        const { alerts } = resp;
        const filteredAlerts = _.filter(alerts, { trigger_id: triggerId });
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
    this.setState({ loading: true });
    const { selectedItems } = this.state;
    const { httpClient, notifications } = this.props;

    if (!selectedItems.length) return;

    await this.props.acknowledgeAlerts(selectedItems);

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
    this.setState({ ...this.state, loading: false, selectedItems: [] });
  };

  onSeverityLevelChange = (e) => {
    this.setState({ page: 0, severityLevel: e.target.value });
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

  onCreateTrigger = () => {
    const { history, monitorId, onClose } = this.props;
    onClose();
    history.push(`/monitors/${monitorId}?action=${MONITOR_ACTIONS.UPDATE_MONITOR}`);
  };

  render() {
    const { httpClient, location, history, monitor, notifications, onClose, triggerName } =
      this.props;
    const detectorId = _.get(monitor, MONITOR_INPUT_DETECTOR_ID);
    const groupBy = _.get(monitor, MONITOR_GROUP_BY);
    const monitorType = _.get(monitor, 'monitor_type', MONITOR_TYPE.QUERY_LEVEL);

    const actions = () => {
      const { selectedItems } = this.state;
      const actions = [
        <EuiSmallButton
          onClick={this.acknowledgeAlerts}
          disabled={!selectedItems.length}
          data-test-subj={'alertsDashboardModal_acknowledgeAlertsButton'}
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

    const getItemId = (item) => {
      switch (monitorType) {
        case MONITOR_TYPE.QUERY_LEVEL:
        case MONITOR_TYPE.CLUSTER_METRICS:
        case MONITOR_TYPE.DOC_LEVEL:
          return `${item.id}-${item.version}`;
        case MONITOR_TYPE.BUCKET_LEVEL:
          return item.id;
      }
    };

    const {
      alerts = [],
      alertState,
      flyoutIsOpen,
      loading,
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

    const getColumns = () => {
      let columns;
      switch (monitorType) {
        case MONITOR_TYPE.BUCKET_LEVEL:
          columns = insertGroupByColumn(groupBy);
          break;
        case MONITOR_TYPE.DOC_LEVEL:
          columns = _.cloneDeep(queryColumns);
          columns.splice(
            0,
            0,
            getAlertsFindingColumn(
              httpClient,
              history,
              location,
              notifications,
              flyoutIsOpen,
              () => this.setState({ flyoutIsOpen: true }),
              () => this.setState({ flyoutIsOpen: false })
            )
          );
          break;
        default:
          columns = queryColumns;
          break;
      }
      columns = removeColumns(['trigger_name'], columns);

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
      <EuiOverlayMask>
        <EuiModal
          onClose={onClose}
          maxWidth={false}
          data-test-subj={`alertsDashboardModal_${triggerName}`}
        >
          <EuiModalHeader data-test-subj={`alertsDashboardModal_header_${triggerName}`}>
            <EuiModalHeaderTitle>
              {`Select which alerts to acknowledge for ${triggerName}`}
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiFlexGroup>
              <EuiFlexItem>
                <ContentPanel
                  title={`Alerts (${selectedItems.length}/${totalAlerts})`}
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
                    onSeverityChange={this.onSeverityLevelChange}
                    onStateChange={this.onAlertStateChange}
                    onPageChange={this.onPageClick}
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
                    onChange={this.onTableChange}
                    noItemsMessage={
                      loading ? (
                        'Loading alerts...'
                      ) : (
                        <DashboardEmptyPrompt
                          onCreateTrigger={this.onCreateTrigger}
                          isModal={true}
                        />
                      )
                    }
                    data-test-subj={`alertsDashboardModal_table_${triggerName}`}
                  />
                </ContentPanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiModalBody>
          <EuiModalFooter>
            <EuiSmallButton
              onClick={onClose}
              fill
              data-test-subj={`alertsDashboardModal_closeButton_${triggerName}`}
            >
              Close
            </EuiSmallButton>
          </EuiModalFooter>
        </EuiModal>
      </EuiOverlayMask>
    );
  }
}

AcknowledgeAlertsModal.propTypes = {
  httpClient: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  monitor: PropTypes.object.isRequired,
  monitorId: PropTypes.string.isRequired,
  notifications: PropTypes.object.isRequired,
  triggerId: PropTypes.string.isRequired,
  triggerName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  acknowledgeAlerts: PropTypes.func.isRequired,
};
