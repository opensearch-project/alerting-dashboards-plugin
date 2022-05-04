/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Fragment } from 'react';
import _ from 'lodash';
import queryString from 'query-string';
import {
  EuiButton,
  EuiButtonEmpty,
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
  EuiTitle,
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
import { backendErrorNotification } from '../../../utils/helpers';
import { getUnwrappedTriggers } from './Triggers/Triggers';
import { formikToMonitor } from '../../CreateMonitor/containers/CreateMonitor/utils/formikToMonitor';
import monitorToFormik from '../../CreateMonitor/containers/CreateMonitor/utils/monitorToFormik';
import FindingsDashboard from '../../Dashboard/containers/FindingsDashboard';
import { TABLE_TAB_IDS } from '../../Dashboard/components/FindingsDashboard/findingsUtils';

export default class MonitorDetails extends Component {
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
      editMonitor: () => {
        this.props.history.push({
          ...this.props.location,
          search: `?action=${MONITOR_ACTIONS.UPDATE_MONITOR}`,
        });
      },
      isJsonModalOpen: false,
      tabId: TABLE_TAB_IDS.ALERTS.id,
    };
  }

  componentDidMount() {
    this.getMonitor(this.props.match.params.monitorId);
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

  getDetector = (id) => {
    const { httpClient, notifications } = this.props;
    httpClient
      .get(`../api/alerting/detectors/${id}`)
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

  getMonitor = (id) => {
    const { httpClient } = this.props;
    httpClient
      .get(`../api/alerting/monitors/${id}`)
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

  updateMonitor = (update, actionKeywords = ['update', 'monitor']) => {
    const {
      match: {
        params: { monitorId },
      },
      httpClient,
      notifications,
    } = this.props;
    const { monitor, ifSeqNo, ifPrimaryTerm } = this.state;

    let query = { ifSeqNo, ifPrimaryTerm };
    switch (monitor.monitor_type) {
      case MONITOR_TYPE.DOC_LEVEL:
        query = {};
        break;
    }

    this.setState({ updating: true });
    return httpClient
      .put(`../api/alerting/monitors/${monitorId}`, {
        query: { ...query },
        body: JSON.stringify({ ...monitor, ...update }),
      })
      .then((resp) => {
        if (resp.ok) {
          const { version: monitorVersion } = resp;
          this.setState({ monitorVersion, updating: false });
        } else {
          console.error('Failed to update the monitor:', resp);
          backendErrorNotification(notifications, ...actionKeywords, resp.resp);
          this.setState({ updating: false }); // release the button
        }
        return resp;
      })
      .catch((err) => {
        console.log('err', err);
        this.setState({ updating: false });
        return err;
      });
  };

  onCreateTrigger = () => {
    this.props.history.push({
      ...this.props.location,
      search: `?action=${TRIGGER_ACTIONS.CREATE_TRIGGER}`,
    });
  };

  onCloseTrigger = () => {
    this.props.history.push({ ...this.props.location, search: '' });
    this.setState({ triggerToEdit: null });
  };

  onEditTrigger = (trigger) => {
    this.setState({ triggerToEdit: trigger });
    this.props.history.push({
      ...this.props.location,
      search: `?action=${TRIGGER_ACTIONS.UPDATE_TRIGGER}`,
    });
  };

  renderNoTriggersCallOut = () => {
    const { monitor, editMonitor } = this.state;
    if (!monitor.triggers.length) {
      return (
        <Fragment>
          <EuiCallOut
            title={
              <span>
                This monitor has no triggers configured. To receive alerts from this monitor you
                must first create a trigger.{' '}
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
          <EuiSpacer size="s" />
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
    } = this.state;
    const {
      location,
      match: {
        params: { monitorId },
      },
      httpClient,
      notifications,
      isDarkMode,
    } = this.props;
    const { action } = queryString.parse(location.search);
    const updatingMonitor = action === MONITOR_ACTIONS.UPDATE_MONITOR;
    const detectorId = _.get(monitor, MONITOR_INPUT_DETECTOR_ID, undefined);

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
          {...this.props}
        />
      );
    }

    const displayTableTabs = monitor.monitor_type === MONITOR_TYPE.DOC_LEVEL;
    return (
      <div style={{ padding: '25px 50px' }}>
        {this.renderNoTriggersCallOut()}
        <EuiFlexGroup alignItems="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiTitle size="l" style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <h1
                style={{
                  whiteSpace: 'nowrap',
                  maxWidth: '90%',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                {monitor.name}
              </h1>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem style={{ paddingBottom: '5px', marginLeft: '0px' }}>
            {monitor.enabled ? (
              <EuiHealth color="success">Enabled</EuiHealth>
            ) : (
              <EuiHealth color="subdued">Disabled</EuiHealth>
            )}
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton onClick={editMonitor}>Edit</EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              isLoading={updating}
              onClick={() => this.updateMonitor({ enabled: !monitor.enabled })}
            >
              {monitor.enabled ? 'Disable' : 'Enable'}
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton onClick={this.showJsonModal}>Export as JSON</EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
        <MonitorOverview
          monitor={monitor}
          monitorId={monitorId}
          monitorVersion={monitorVersion}
          activeCount={activeCount}
          detector={detector}
          detectorId={detectorId}
        />
        <EuiSpacer />
        <Triggers
          monitor={monitor}
          updateMonitor={this.updateMonitor}
          onEditTrigger={this.onEditTrigger}
          onCreateTrigger={this.onCreateTrigger}
        />
        <div className="eui-hideFor--xs eui-hideFor--s eui-hideFor--m">
          <EuiSpacer />
          <MonitorHistory
            httpClient={httpClient}
            monitorId={monitorId}
            onShowTrigger={editMonitor}
            triggers={getUnwrappedTriggers(monitor)}
            isDarkMode={isDarkMode}
            notifications={notifications}
            monitorType={monitor.monitor_type}
          />
        </div>
        <EuiSpacer />

        {displayTableTabs ? (
          <div>
            <EuiTabs>{this.renderTableTabs()}</EuiTabs>
            {this.state.tabContent}
          </div>
        ) : (
          this.renderAlertsTable()
        )}

        {isJsonModalOpen && (
          <EuiOverlayMask>
            <EuiModal onClose={this.closeJsonModal} style={{ padding: '5px 30px' }}>
              <EuiModalHeader>
                <EuiModalHeaderTitle>{'View JSON of ' + monitor.name} </EuiModalHeaderTitle>
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
                <EuiButtonEmpty onClick={this.closeJsonModal}>Close</EuiButtonEmpty>
              </EuiModalFooter>
            </EuiModal>
          </EuiOverlayMask>
        )}
      </div>
    );
  }
}
