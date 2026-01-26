/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Fragment } from 'react';
import _ from 'lodash';
import queryString from 'query-string';
import {
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiCallOut,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiLink,
  EuiLoadingSpinner,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiToolTip,
  EuiIcon,
} from '@elastic/eui';
import CreateMonitor from '../../CreateMonitor';
import MonitorOverviewV2 from '../components/MonitorOverview/MonitorOverviewV2';
import Dashboard from '../../Dashboard/containers/Dashboard';
import TriggersPpl from './Triggers/TriggersPpl';
import {
  MONITOR_ACTIONS,
  MONITOR_GROUP_BY,
  MONITOR_INPUT_DETECTOR_ID,
  MONITOR_TYPE,
} from '../../../utils/constants';
import { migrateTriggerMetadata } from './utils/helpers';
import { backendErrorNotification } from '../../../utils/helpers';
import { deletePplMonitor } from '../../../utils/pplHelpers';
import { getUnwrappedTriggers } from './Triggers/Triggers';
import { formikToMonitor } from '../../CreateMonitor/containers/CreateMonitor/utils/formikToMonitor';
import monitorToFormik from '../../CreateMonitor/containers/CreateMonitor/utils/monitorToFormik';
import pplAlertingMonitorToFormik from '../../CreateMonitor/containers/CreateMonitor/utils/pplAlertingMonitorToFormik';
import { buildPPLMonitorFromFormik } from '../../CreateMonitor/containers/CreateMonitor/utils/pplFormikToMonitor';
import FindingsDashboard from '../../Dashboard/containers/FindingsDashboard';
import { TABLE_TAB_IDS } from '../../Dashboard/components/FindingsDashboard/findingsUtils';
import { DeleteMonitorModal } from '../../../components/DeleteModal/DeleteMonitorModal';
import { getLocalClusterName } from '../../CreateMonitor/components/CrossClusterConfigurations/utils/helpers';
import { getDataSourceQueryObj, parseQueryStringAndGetDataSource } from '../../utils/helpers';
import { MultiDataSourceContext } from '../../../../public/utils/MultiDataSourceContext';
import { getUseUpdatedUx, setDataSource } from '../../../services';
import { PageHeader } from '../../../components/PageHeader/PageHeader';

export default class MonitorDetailsV2 extends Component {
  static contextType = MultiDataSourceContext;
  constructor(props) {
    super(props);
    this.state = {
      monitor: null,
      monitorVersion: 0,
      ifSeqNo: 0,
      ifPrimaryTerm: 0,
      dayCount: 0,
      activeCount: 0,
      loading: true,
      updating: false,
      error: null,
      triggerToEdit: null,
      delegateMonitors: [],
      editMonitor: () => {
        const dataSourceId = parseQueryStringAndGetDataSource(this.props.location?.search);
        const monitorType = this.state.monitor.monitor_type;
        this.props.history.push({
          ...this.props.location,
          search: `?action=${MONITOR_ACTIONS.EDIT_MONITOR}&monitorType=${monitorType}${
            dataSourceId !== undefined ? `&dataSourceId=${dataSourceId}` : ''
          }`,
        });
      },
      isJsonModalOpen: false,
      tabId: TABLE_TAB_IDS.ALERTS.id,
      showDeleteModal: false,
      localClusterName: undefined,
    };
  }

  /** Retrieve ppl_monitor from V2 payloads when present */
  getV2Ppl = (mon) => {
    if (!mon) return null;
    return mon?.monitor_v2?.ppl_monitor ?? mon?.monitorV2?.ppl_monitor ?? mon?.ppl_monitor ?? null;
  };

  getDisplayMonitor = () => {
    const { monitor } = this.state;
    const v2 = this.getV2Ppl(monitor);
    if (!v2) return monitor || {};
    const lookBackWindowMinutes =
      v2.look_back_window_minutes ??
      v2.look_back_window ??
      monitor?.look_back_window_minutes ??
      monitor?.look_back_window;
    return {
      ...monitor,
      name: v2.name ?? monitor?.name,
      enabled: typeof v2.enabled === 'boolean' ? v2.enabled : monitor?.enabled,
      triggers: Array.isArray(v2.triggers) ? v2.triggers : monitor?.triggers || [],
      schedule: v2.schedule ?? monitor?.schedule,
      look_back_window: lookBackWindowMinutes,
      look_back_window_minutes: lookBackWindowMinutes,
      query_language: v2.query_language ?? monitor?.query_language,
      query: v2.query ?? monitor?.query,
      description: v2.description ?? monitor?.description,
      last_update_time: v2.last_update_time ?? monitor?.last_update_time,
      timestamp_field: v2.timestamp_field ?? monitor?.timestamp_field,
    };
  };

  isWorkflow = () => {
    const { monitor } = this.state;
    if (monitor && monitor.workflow_type) {
      return true;
    }

    const searchParams = new URLSearchParams(this.props.location.search);
    return (
      searchParams.get('type') === 'workflow' || searchParams.get('monitorType') === 'composite'
    );
  };

  componentDidMount() {
    if (this.context?.dataSourceId) {
      setDataSource({ dataSourceId: this.context.dataSourceId });
    }
    this.getMonitor(this.props.match.params.monitorId);
    const dataSourceQuery = getDataSourceQueryObj();
    this.getLocalClusterName(dataSourceQuery);
  }

  componentDidUpdate(prevProps, prevState) {
    // Refresh monitor when ifSeqNo changes (indicates monitor was updated)
    // Check if ifSeqNo exists and has changed
    const ifSeqNoChanged =
      this.state.ifSeqNo !== undefined &&
      this.state.ifSeqNo !== prevState.ifSeqNo &&
      !prevState.loading;

    if (ifSeqNoChanged) {
      this.getMonitor(this.props.match.params.monitorId);
      return; // Early return to avoid multiple refreshes
    }

    // Also check monitorVersion as fallback
    const monitorVersionChanged =
      this.state.monitorVersion !== prevState.monitorVersion && !prevState.loading;

    if (monitorVersionChanged) {
      this.getMonitor(this.props.match.params.monitorId);
      return;
    }

    // Refresh monitor when entering or exiting edit mode to ensure we have the latest data
    const prevAction = queryString.parse(prevProps.location.search).action;
    const currentAction = queryString.parse(this.props.location.search).action;
    const enteringEditMode =
      prevAction !== MONITOR_ACTIONS.EDIT_MONITOR && currentAction === MONITOR_ACTIONS.EDIT_MONITOR;
    const exitingEditMode =
      prevAction === MONITOR_ACTIONS.EDIT_MONITOR &&
      currentAction !== MONITOR_ACTIONS.EDIT_MONITOR &&
      !prevState.loading;

    if (enteringEditMode) {
      this.getMonitor(this.props.match.params.monitorId);
    } else if (exitingEditMode) {
      this.getMonitor(this.props.match.params.monitorId);
    }
  }

  componentWillUnmount() {
    this.props.setFlyout(null);
  }

  getLocalClusterName = async (dataSourceQuery) => {
    this.setState({
      localClusterName: await getLocalClusterName(this.props.httpClient, dataSourceQuery),
    });
  };

  getDetector = (id) => {
    const { httpClient } = this.props;
    const dataSourceQuery = getDataSourceQueryObj();
    httpClient
      .get(`../api/alerting/detectors/${id}`, dataSourceQuery)
      .then((resp) => {
        const { ok, detector, version: detectorVersion } = resp;
        if (ok) {
          this.setState({
            detector: detector,
            detectorVersion,
          });
        } else {
          console.log('can not get detector', id);
        }
      })
      .catch((err) => {
        console.log('error while getting detector', err);
      });
  };

  updateDelegateMonitors = async (monitor) => {
    const getMonitor = async (id) => {
      try {
        const resp = await this.getMonitorFromApi(id);
        return resp?.ok ? resp.resp : undefined;
      } catch (err) {
        console.error('err', err);
        return undefined;
      }
    };

    const delegateMonitors = [];

    for (const { monitor_id } of monitor.inputs[0].composite_input.sequence.delegates) {
      const delegateMonitor = await getMonitor(monitor_id);
      if (!delegateMonitor) return;

      delegateMonitors.push(delegateMonitor);
    }

    this.setState({
      delegateMonitors: delegateMonitors.map((mon) => ({
        ...mon,
        monitor_id: mon.id,
        monitor_name: mon.name,
      })),
    });
  };

  getMonitorFromApi = async (id, { treatAsWorkflow = false, useV2Endpoint = false } = {}) => {
    const dataSourceQuery = getDataSourceQueryObj();
    const { httpClient, viewMode } = this.props;
    const encodedId = encodeURIComponent(id);

    // Use v2 endpoint if explicitly requested, or if viewMode is 'new'
    if (viewMode === 'new' || useV2Endpoint) {
      return httpClient.get(`../api/alerting/v2/monitors/${encodedId}`, dataSourceQuery);
    }

    const resource = treatAsWorkflow ? 'workflows' : 'monitors';
    return httpClient.get(`../api/alerting/${resource}/${encodedId}`, dataSourceQuery);
  };

  getMonitor = (id) => {
    const fetchMonitor = async () => {
      try {
        // MonitorDetailsV2 always uses v2 endpoint (viewMode is always 'new')
        const resp = await this.getMonitorFromApi(id);

        if (resp?.ok) {
          const {
            resp: monitorPayload,
            version: monitorVersion,
            dayCount,
            activeCount,
            ifSeqNo,
            ifPrimaryTerm,
          } = resp;

          const isWorkflow = this.isWorkflow();
          if (isWorkflow) {
            this.updateDelegateMonitors(monitorPayload);
          }

          const normalizedMonitor = migrateTriggerMetadata(monitorPayload);
          const pplMonitor = this.getV2Ppl(normalizedMonitor);
          if (pplMonitor) {
            normalizedMonitor.name = pplMonitor.name ?? normalizedMonitor.name;
            normalizedMonitor.description = pplMonitor.description ?? normalizedMonitor.description;
            normalizedMonitor.last_update_time =
              pplMonitor.last_update_time ?? normalizedMonitor.last_update_time;
            normalizedMonitor.timestamp_field =
              pplMonitor.timestamp_field ?? normalizedMonitor.timestamp_field;
            // Copy look_back_window_minutes from pplMonitor to root level for proper editing
            normalizedMonitor.look_back_window_minutes =
              pplMonitor.look_back_window_minutes ?? normalizedMonitor.look_back_window_minutes;
          } else {
            // If pplMonitor is null, the response is flat - ensure look_back_window_minutes is preserved
            // It should already be in normalizedMonitor from migrateTriggerMetadata, but ensure it's there
            if (monitorPayload?.look_back_window_minutes !== undefined) {
              normalizedMonitor.look_back_window_minutes = monitorPayload.look_back_window_minutes;
            }
          }

          const monitorIdentifier = monitorPayload?.id || normalizedMonitor?.id || id;
          const enrichedMonitor = {
            ...normalizedMonitor,
            id: monitorIdentifier,
            _id: monitorPayload?._id || normalizedMonitor?._id || monitorIdentifier,
            _seq_no: ifSeqNo,
            _primary_term: ifPrimaryTerm,
          };

          this.setState({
            ifSeqNo,
            ifPrimaryTerm,
            monitor: enrichedMonitor,
            monitorVersion,
            dayCount,
            activeCount,
            loading: false,
            error: null,
          });

          const adId = _.get(normalizedMonitor, MONITOR_INPUT_DETECTOR_ID, undefined);
          if (adId) {
            this.getDetector(adId);
          }
          this.setState({ tabContent: this.renderAlertsTable() });
        } else {
          this.props.history.push('/monitors');
        }
      } catch (err) {
        this.props.history.push('/monitors');
      }
    };

    fetchMonitor();
  };

  updateMonitor = async (update, actionKeywords = ['update', 'monitor']) => {
    const {
      match: {
        params: { monitorId },
      },
      httpClient,
      notifications,
    } = this.props;
    const { monitor } = this.state;

    if (!monitorId || !monitor) {
      return;
    }

    this.setState({ updating: true });

    const dataSourceQuery = getDataSourceQueryObj();

    try {
      // MonitorDetailsV2 only handles PPL monitors (v2 API)
      const basePplMonitor = _.cloneDeep(
        this.getV2Ppl(monitor) || monitor?.ppl_monitor || monitor || {}
      );

      const cleanedPplMonitor = _.omit({ ...basePplMonitor, ...update }, [
        'id',
        '_id',
        'item_type',
        'monitor_type',
        'version',
        '_version',
        'ifSeqNo',
        'ifPrimaryTerm',
        '_seq_no',
        '_primary_term',
        'ui_metadata',
        'last_update_time',
        'enabled_time',
      ]);

      if (Array.isArray(cleanedPplMonitor.triggers)) {
        cleanedPplMonitor.triggers = cleanedPplMonitor.triggers.map((trigger) =>
          _.omit(trigger, ['id', 'last_triggered_time', 'last_execution_time'])
        );
      }

      const pplQuery = {
        ...(dataSourceQuery?.query || {}),
      };

      const resp = await httpClient.put(`../api/alerting/v2/monitors/${monitorId}`, {
        query: pplQuery,
        body: JSON.stringify({ ppl_monitor: cleanedPplMonitor }),
      });

      if (!resp?.ok) {
        backendErrorNotification(notifications, ...actionKeywords, resp?.resp);
        this.setState({ updating: false });
        return resp;
      }

      const nextState = { updating: false };
      if (resp.version !== undefined) {
        nextState.monitorVersion = resp.version;
      }
      if (resp.ifSeqNo !== undefined) {
        nextState.ifSeqNo = resp.ifSeqNo;
      }
      if (resp.ifPrimaryTerm !== undefined) {
        nextState.ifPrimaryTerm = resp.ifPrimaryTerm;
      }

      // Optimistically update monitor state with the changes
      if (monitor) {
        const updatedMonitor = { ...monitor };
        const v2Ppl = this.getV2Ppl(monitor);

        if (v2Ppl) {
          // Update the nested ppl_monitor object
          if (updatedMonitor.monitor_v2) {
            updatedMonitor.monitor_v2 = {
              ...updatedMonitor.monitor_v2,
              ppl_monitor: {
                ...updatedMonitor.monitor_v2.ppl_monitor,
                ...update,
              },
            };
          } else if (updatedMonitor.monitorV2) {
            updatedMonitor.monitorV2 = {
              ...updatedMonitor.monitorV2,
              ppl_monitor: {
                ...updatedMonitor.monitorV2.ppl_monitor,
                ...update,
              },
            };
          } else if (updatedMonitor.ppl_monitor) {
            updatedMonitor.ppl_monitor = {
              ...updatedMonitor.ppl_monitor,
              ...update,
            };
          }
        }
        // Also update root level enabled for immediate UI update
        if (update.enabled !== undefined) {
          updatedMonitor.enabled = update.enabled;
        }

        nextState.monitor = updatedMonitor;
      }

      // Update state - componentDidUpdate will detect ifSeqNo change and refresh monitor data
      this.setState(nextState);

      return resp;
    } catch (err) {
      console.log('err', err);
      this.setState({ updating: false });
      return err;
    }
  };

  renderNoTriggersCallOut = () => {
    const { editMonitor } = this.state;
    const displayMonitor = this.getDisplayMonitor();
    const hasNoTriggers =
      !Array.isArray(displayMonitor?.triggers) || displayMonitor.triggers.length === 0;

    const callout = (
      <EuiCallOut
        title={
          <span>
            This monitor has no triggers configured. To receive alerts from this monitor you must
            first create a trigger.{' '}
            {
              <EuiLink style={{ textDecoration: 'underline' }} onClick={editMonitor}>
                Edit monitor
              </EuiLink>
            }
          </span>
        }
        iconType="alert"
        size="s"
      />
    );

    if (hasNoTriggers) {
      return (
        <Fragment>
          <PageHeader appBottomControls={[{ renderComponent: callout }]}>
            {callout}
            <EuiSpacer size="s" />
          </PageHeader>
        </Fragment>
      );
    }

    return null;
  };

  showJsonModal = () => {
    this.setState({ isJsonModalOpen: true });
  };

  closeJsonModal = () => {
    this.setState({ isJsonModalOpen: false });
  };

  getJsonForExport = (monitor) => {
    if (!monitor) return {};

    const isPplView = this.props.viewMode === 'new';
    const pplSource = this.getV2Ppl(monitor) || (isPplView && monitor ? monitor : null);

    if (pplSource) {
      const formikValues = pplAlertingMonitorToFormik(this.getV2Ppl(monitor) ? monitor : pplSource);
      formikValues.triggerDefinitions = Array.isArray(pplSource.triggers)
        ? _.cloneDeep(pplSource.triggers)
        : [];
      return buildPPLMonitorFromFormik(formikValues);
    }

    const monitorValues = monitorToFormik(monitor);
    const triggers = _.get(monitor, 'triggers', []);
    return { ...formikToMonitor(monitorValues), triggers };
  };

  handleAlertsTotals = ({ totalAlerts } = {}) => {
    const parsed =
      typeof totalAlerts === 'number'
        ? totalAlerts
        : Number.isFinite(Number(totalAlerts))
        ? Number(totalAlerts)
        : NaN;
    const normalized = Number.isFinite(parsed) ? parsed : 0;
    if (normalized !== this.state.activeCount) {
      this.setState({ activeCount: normalized });
    }
  };

  onDeleteClick = () => {
    this.setState({ showDeleteModal: true });
  };

  deleteMonitor = async () => {
    const dataSourceQuery = getDataSourceQueryObj();
    try {
      const deleteResult = await deletePplMonitor(
        this.state.monitor,
        this.props.httpClient,
        this.props.notifications,
        dataSourceQuery
      );
      if (deleteResult?.ok) {
        this.props.history.push('/monitors');
      }
      return deleteResult;
    } catch (err) {
      console.error('[MonitorDetailsV2] deleteMonitor error', err);
      return err;
    }
  };

  renderAlertsTable = () => {
    const { monitor, editMonitor } = this.state;
    const {
      location,
      match: {
        params: { monitorId },
      },
      history,
      httpClient,
      notifications,
      setFlyout,
    } = this.props;
    const detectorId = _.get(monitor, MONITOR_INPUT_DETECTOR_ID, undefined);
    const groupBy = _.get(monitor, MONITOR_GROUP_BY);
    return (
      <Dashboard
        monitorIds={[monitorId]}
        detectorIds={detectorId ? [detectorId] : []}
        onCreateTrigger={editMonitor}
        initialViewMode="new"
        httpClient={httpClient}
        location={location}
        history={history}
        notifications={notifications}
        monitorType={monitor.monitor_type}
        perAlertView={true}
        groupBy={groupBy}
        setFlyout={setFlyout}
        onTotalsChange={this.handleAlertsTotals}
        hideActionsAndComments={true}
      />
    );
  };

  renderFindingsTable = () => {
    const {
      httpClient,
      history,
      location,
      notifications,
      match: {
        params: { monitorId },
      },
    } = this.props;
    return (
      <FindingsDashboard
        monitorId={monitorId}
        httpClient={httpClient}
        location={location}
        history={history}
        notifications={notifications}
      />
    );
  };

  renderTableTabs = () => {
    const { tabId, monitor } = this.state;
    const tabs = [{ ...TABLE_TAB_IDS.ALERTS, content: this.renderAlertsTable() }];

    if (monitor.monitor_type !== MONITOR_TYPE.COMPOSITE_LEVEL) {
      tabs.push({ ...TABLE_TAB_IDS.FINDINGS, content: this.renderFindingsTable() });
    }

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
        style={{ paddingTop: '0px' }}
      >
        {tab.name}
      </EuiTab>
    ));
  };

  render() {
    const {
      monitor,
      detector,
      monitorVersion,
      activeCount,
      updating,
      loading,
      editMonitor,
      isJsonModalOpen,
      showDeleteModal,
      delegateMonitors,
      localClusterName,
    } = this.state;
    const {
      location,
      match: {
        params: { monitorId },
      },
      httpClient,
      notifications,
      setFlyout,
    } = this.props;
    const { action } = queryString.parse(location.search);
    const displayMonitor = this.getDisplayMonitor();
    const updatingMonitor = action === MONITOR_ACTIONS.EDIT_MONITOR;
    const detectorId = _.get(displayMonitor, MONITOR_INPUT_DETECTOR_ID, undefined);

    if (loading) {
      return (
        <EuiFlexGroup justifyContent="center" alignItems="center" style={{ marginTop: '100px' }}>
          <EuiLoadingSpinner size="xl" />
        </EuiFlexGroup>
      );
    }

    if (updatingMonitor) {
      return (
        <CreateMonitor
          key={`monitor-edit-${monitor?._seq_no}`}
          edit={true}
          updateMonitor={this.updateMonitor}
          monitorToEdit={monitor}
          detectorId={detectorId}
          notifications={notifications}
          setFlyout={setFlyout}
          {...this.props}
        />
      );
    }

    const displayTableTabs = [MONITOR_TYPE.DOC_LEVEL, MONITOR_TYPE.COMPOSITE_LEVEL].includes(
      displayMonitor.monitor_type
    );

    const badgeControl = displayMonitor.enabled ? (
      <EuiHealth color="success">Enabled</EuiHealth>
    ) : (
      <EuiHealth color="subdued">Disabled</EuiHealth>
    );
    const useUpdatedUx = getUseUpdatedUx();

    const monitorActions = [
      <EuiSmallButton
        isLoading={updating}
        onClick={() => this.updateMonitor({ enabled: !displayMonitor.enabled })}
      >
        {displayMonitor.enabled ? 'Disable' : 'Enable'}
      </EuiSmallButton>,
      <EuiSmallButton onClick={this.showJsonModal}>Export as JSON</EuiSmallButton>,
    ];

    if (useUpdatedUx) {
      monitorActions.unshift(
        <EuiToolTip content="Delete">
          <EuiSmallButton onClick={this.onDeleteClick} color="danger" aria-label="Delete">
            <EuiIcon type="trash" />
          </EuiSmallButton>
        </EuiToolTip>
      );
      monitorActions.push(
        <EuiSmallButton onClick={editMonitor} fill>
          Edit
        </EuiSmallButton>
      );
    } else {
      monitorActions.push(
        <EuiSmallButton onClick={this.onDeleteClick} color="danger" aria-label="Delete">
          Delete
        </EuiSmallButton>
      );
      monitorActions.unshift(
        <EuiSmallButton onClick={editMonitor} fill>
          Edit
        </EuiSmallButton>
      );
    }

    return (
      <div style={{ padding: '16px' }}>
        {this.renderNoTriggersCallOut()}
        <PageHeader
          appBadgeControls={[{ renderComponent: badgeControl }]}
          appRightControls={monitorActions.map((action) => ({
            renderComponent: action,
          }))}
        >
          <EuiFlexGroup alignItems="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiText size="s" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <h1>{displayMonitor.name}</h1>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem style={{ paddingBottom: '5px', marginLeft: '0px' }}>
              {badgeControl}
            </EuiFlexItem>
            {monitorActions.map((action, idx) => (
              <EuiFlexItem grow={false} key={idx}>
                {action}
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>
        </PageHeader>
        {!useUpdatedUx && <EuiSpacer />}
        <MonitorOverviewV2
          monitor={displayMonitor}
          monitorId={monitorId}
          activeCount={activeCount}
          delegateMonitors={delegateMonitors}
          landingDataSourceId={this.context?.dataSourceId}
        />
        <EuiSpacer />
        <TriggersPpl
          monitor={displayMonitor}
          httpClient={httpClient}
          delegateMonitors={delegateMonitors}
          updateMonitor={this.updateMonitor}
        />
        <EuiSpacer />

        {displayTableTabs ? (
          <div>
            {displayMonitor.monitor_type !== MONITOR_TYPE.COMPOSITE_LEVEL ? (
              <EuiTabs size="s">{this.renderTableTabs()}</EuiTabs>
            ) : null}
            {this.state.tabContent}
          </div>
        ) : (
          this.renderAlertsTable()
        )}

        {isJsonModalOpen && (
          <EuiOverlayMask>
            <EuiModal onClose={this.closeJsonModal} style={{ padding: '5px 30px' }}>
              <EuiModalHeader>
                <EuiModalHeaderTitle>
                  {'View JSON of ' + (displayMonitor.name || '')}
                </EuiModalHeaderTitle>
              </EuiModalHeader>

              <EuiModalBody>
                <EuiCodeBlock
                  language="json"
                  fontSize="m"
                  paddingSize="m"
                  overflowHeight={600}
                  inline={false}
                  isCopyable
                >
                  {JSON.stringify(this.getJsonForExport(monitor), null, 3)}
                </EuiCodeBlock>
              </EuiModalBody>

              <EuiModalFooter>
                <EuiSmallButtonEmpty onClick={this.closeJsonModal}>Close</EuiSmallButtonEmpty>
              </EuiModalFooter>
            </EuiModal>
          </EuiOverlayMask>
        )}
        {showDeleteModal && (
          <DeleteMonitorModal
            monitors={[monitor]}
            closeDeleteModal={() => this.setState({ showDeleteModal: false })}
            onClickDelete={() => this.deleteMonitor()}
          />
        )}
      </div>
    );
  }
}
