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
import MonitorOverview from '../components/MonitorOverview';
import MonitorHistory from './MonitorHistory';
import Dashboard from '../../Dashboard/containers/Dashboard';
import Triggers from './Triggers';
import {
  MONITOR_ACTIONS,
  MONITOR_GROUP_BY,
  MONITOR_INPUT_DETECTOR_ID,
  MONITOR_TYPE,
  TRIGGER_ACTIONS,
} from '../../../utils/constants';
import { migrateTriggerMetadata } from './utils/helpers';
import { backendErrorNotification, deleteMonitor } from '../../../utils/helpers';
import { getUnwrappedTriggers } from './Triggers/Triggers';
import { formikToMonitor } from '../../CreateMonitor/containers/CreateMonitor/utils/formikToMonitor';
import monitorToFormik from '../../CreateMonitor/containers/CreateMonitor/utils/monitorToFormik';
import FindingsDashboard from '../../Dashboard/containers/FindingsDashboard';
import { TABLE_TAB_IDS } from '../../Dashboard/components/FindingsDashboard/findingsUtils';
import { DeleteMonitorModal } from '../../../components/DeleteModal/DeleteMonitorModal';
import { getLocalClusterName } from '../../CreateMonitor/components/CrossClusterConfigurations/utils/helpers';
import { getDataSourceQueryObj, parseQueryStringAndGetDataSource } from '../../utils/helpers';
import { MultiDataSourceContext } from '../../../../public/utils/MultiDataSourceContext';
import { getUseUpdatedUx, setDataSource } from '../../../services';
import { PageHeader } from '../../../components/PageHeader/PageHeader';

export default class MonitorDetails extends Component {
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

  /** Return ppl_monitor from V2 if present, otherwise null */
  getV2Ppl = (mon) => {
    if (!mon) return null;
    return mon?.monitor_v2?.ppl_monitor ?? mon?.monitorV2?.ppl_monitor ?? mon?.ppl_monitor ?? null;
  };

  getDisplayMonitor = () => {
    const { monitor } = this.state;
    const v2 = this.getV2Ppl(monitor);
    if (!v2) return monitor || {};
    return {
      ...monitor,
      name: v2.name ?? monitor?.name,
      enabled: typeof v2.enabled === 'boolean' ? v2.enabled : monitor?.enabled,
      triggers: Array.isArray(v2.triggers) ? v2.triggers : (monitor?.triggers || []),
      schedule: v2.schedule ?? monitor?.schedule,
      look_back_window: v2.look_back_window_minutes ?? v2.look_back_window ?? monitor?.look_back_window,
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
    if (this.state.monitorVersion !== prevState.monitorVersion && !prevState.loading) {
      // this can happen on initial load when going from 0 -> currentVersion
      // so if we haven't also gone from loading: true -> loading: false we're fine
      // ie if prev loading state was false we're fine
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
    const { httpClient, notifications } = this.props;
    const dataSourceQuery = getDataSourceQueryObj();
    httpClient
      .get(`../api/alerting/detectors/${id}`, dataSourceQuery)
      .then((resp) => {
        const { ok, detector, version: detectorVersion, seqNo, primaryTerm } = resp;
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
    const dataSourceQuery = getDataSourceQueryObj();
    const getMonitor = async (id) => {
      const url = `../api/alerting/monitors/${id}`;
      return this.props.httpClient
        .get(url, dataSourceQuery)
        .then((res) => {
          return res.resp;
        })
        .catch((err) => {
          console.error('err', err);
          return undefined;
        });
    };

    const delegateMonitors = [];

    for (const { monitor_id } of monitor.inputs[0].composite_input.sequence.delegates) {
      const monitor = await getMonitor(monitor_id);
      if (!monitor) return;

      delegateMonitors.push(monitor);
    }

    this.setState({
      delegateMonitors: delegateMonitors.map((mon) => ({
        ...mon,
        monitor_id: mon.id,
        monitor_name: mon.name,
      })),
    });
  };

  getMonitor = (id) => {
    const { httpClient } = this.props;
    const isWorkflow = this.isWorkflow();
    // Construct the full URL with the query parameters
    const url = `../api/alerting/${isWorkflow ? 'workflows' : 'monitors'}/${id}`;
    // Make the HTTP GET request with the constructed URL and query parameters
    const dataSourceQuery = getDataSourceQueryObj();
    const response = httpClient.get(url, dataSourceQuery);
    response
      .then((resp) => {
        const {
          ok,
          resp: monitor,
          version: monitorVersion,
          dayCount,
          activeCount,
          ifSeqNo,
          ifPrimaryTerm,
        } = resp;
        if (ok) {
          if (isWorkflow) {
            this.updateDelegateMonitors(monitor);
          }
          this.setState({
            ifSeqNo,
            ifPrimaryTerm,
            monitor: migrateTriggerMetadata(monitor),
            monitorVersion,
            dayCount,
            activeCount,
            loading: false,
            error: null,
          });
          const adId = _.get(monitor, MONITOR_INPUT_DETECTOR_ID, undefined);
          if (adId) {
            this.getDetector(adId);
          }
          this.setState({ tabContent: this.renderAlertsTable() });
        } else {
          // TODO: 404 handling
          this.props.history.push('/monitors');
        }
      })
      .catch((err) => {
        console.log('err', err);
      });
  };

  updateMonitor = async (update, actionKeywords = ['update', 'monitor']) => {
    const {
      match: {
        params: { monitorId },
      },
      httpClient,
      notifications,
    } = this.props;
    const { monitor, ifSeqNo, ifPrimaryTerm } = this.state;

    if (!monitorId || !monitor) {
      return;
    }

    this.setState({ updating: true });

    const dataSourceQuery = getDataSourceQueryObj();
    const queryParams = {
      ...(dataSourceQuery?.query || {}),
    };

    if (monitor.monitor_type !== MONITOR_TYPE.DOC_LEVEL) {
      if (ifSeqNo !== undefined) queryParams.ifSeqNo = ifSeqNo;
      if (ifPrimaryTerm !== undefined) queryParams.ifPrimaryTerm = ifPrimaryTerm;
    }

    const isPplMonitor = Boolean(
      this.getV2Ppl(monitor) ||
        monitor?.ppl_monitor ||
        monitor?.monitor_mode === 'ppl' ||
        monitor?.monitorMode === 'ppl' ||
        (typeof monitor?.query_language === 'string' &&
          monitor.query_language.toLowerCase() === 'ppl') ||
        (typeof monitor?.queryLanguage === 'string' &&
          monitor.queryLanguage.toLowerCase() === 'ppl')
    );

    try {
      let resp;

      if (isPplMonitor) {
        const basePplMonitor = _.cloneDeep(
          this.getV2Ppl(monitor) || monitor?.ppl_monitor || monitor || {}
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

        resp = await httpClient.put(`../api/alerting/monitors/${monitorId}`, {
          query: queryParams,
          body: JSON.stringify({ monitor_mode: 'ppl', ppl_monitor: cleanedPplMonitor }),
        });
      } else {
        const legacyPayload = _.omit(
          { ...monitor, ...update },
          ['id', '_id', 'item_type', 'currentTime', 'version', '_version', 'ifSeqNo', 'ifPrimaryTerm']
        );

        const path =
          monitor.workflow_type && monitor.workflow_type === MONITOR_TYPE.COMPOSITE_LEVEL
            ? 'workflows'
            : 'monitors';

        resp = await httpClient.put(`../api/alerting/${path}/${monitorId}`, {
          query: queryParams,
          body: JSON.stringify(legacyPayload),
        });
      }

      if (!resp?.ok) {
        backendErrorNotification(notifications, ...actionKeywords, resp?.resp);
        this.setState({ updating: false });
        return resp;
      }

      const nextState = {
        updating: false,
      };
      if (resp.version !== undefined) {
        nextState.monitorVersion = resp.version;
      }
      if (resp.ifSeqNo !== undefined) {
        nextState.ifSeqNo = resp.ifSeqNo;
      }
      if (resp.ifPrimaryTerm !== undefined) {
        nextState.ifPrimaryTerm = resp.ifPrimaryTerm;
      }

      this.setState(nextState, () => {
        if (resp?.version === undefined) {
          this.getMonitor(monitorId);
        }
      });

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
    const hasNoTriggers = !Array.isArray(displayMonitor?.triggers) || displayMonitor.triggers.length === 0;

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
    const monitorValues = monitorToFormik(monitor);
    const triggers = _.get(monitor, 'triggers', []);
    return { ...formikToMonitor(monitorValues), triggers };
  };

  onDeleteClick = () => {
    this.setState({ showDeleteModal: true });
  };

  deleteMonitor = async () => {
    const dataSourceQuery = getDataSourceQueryObj();
    await deleteMonitor(
      this.state.monitor,
      this.props.httpClient,
      this.props.notifications,
      dataSourceQuery
    );
    this.props.history.push('/monitors');
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
        httpClient={httpClient}
        location={location}
        history={history}
        notifications={notifications}
        monitorType={monitor.monitor_type}
        perAlertView={true}
        groupBy={groupBy}
        setFlyout={setFlyout}
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
      isDarkMode,
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
          <EuiSmallButton
            onClick={this.onDeleteClick}
            color="danger"
            aria-label="Delete"
          >
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
        <MonitorOverview
          monitor={displayMonitor}
          monitorId={monitorId}
          monitorVersion={monitorVersion}
          activeCount={activeCount}
          detector={detector}
          detectorId={detectorId}
          delegateMonitors={delegateMonitors}
          localClusterName={localClusterName}
          setFlyout={setFlyout}
          landingDataSourceId={this.context?.dataSourceId}
        />
        <EuiSpacer />
        <Triggers
          monitor={displayMonitor}
          httpClient={httpClient}
          delegateMonitors={delegateMonitors}
          updateMonitor={this.updateMonitor}
          showPplColumns={true}
        />
        {/* TODO: History section commented out - may need to re-add later
        <div className="eui-hideFor--xs eui-hideFor--s eui-hideFor--m">
          <EuiSpacer />
          <MonitorHistory
            httpClient={httpClient}
            monitorId={monitorId}
            onShowTrigger={editMonitor}
            triggers={getUnwrappedTriggers(displayMonitor)}
            isDarkMode={isDarkMode}
            notifications={notifications}
            monitorType={displayMonitor.monitor_type}
          useV2AlertsApi={true}
          />
        </div>
        */}
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
                <EuiModalHeaderTitle>{'View JSON of ' + (displayMonitor.name || '')} </EuiModalHeaderTitle>
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
