/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiHorizontalRule,
  EuiSpacer,
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
} from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel';
import _ from 'lodash';
import DefineBucketLevelTrigger from '../DefineBucketLevelTrigger';
import AddTriggerButton from '../../components/AddTriggerButton';
import TriggerEmptyPrompt from '../../components/TriggerEmptyPrompt';
import { MAX_TRIGGERS } from '../../../MonitorDetails/containers/Triggers/Triggers';
import DefineTrigger from '../DefineTrigger';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { getPathsPerDataType } from '../../../CreateMonitor/containers/DefineMonitor/utils/mappings';
import monitorToFormik from '../../../CreateMonitor/containers/CreateMonitor/utils/monitorToFormik';
import { buildRequest } from '../../../CreateMonitor/containers/DefineMonitor/utils/searchRequests';
import { backendErrorNotification, inputLimitText } from '../../../../utils/helpers';
import moment from 'moment';
import { formikToTrigger } from '../CreateTrigger/utils/formikToTrigger';
import DefineDocumentLevelTrigger from '../DefineDocumentLevelTrigger/DefineDocumentLevelTrigger';
import {
  buildClusterMetricsRequest,
  canExecuteClusterMetricsMonitor,
} from '../../../CreateMonitor/components/ClusterMetricsMonitor/utils/clusterMetricsMonitorHelpers';
import { FORMIK_INITIAL_VALUES } from '../../../CreateMonitor/containers/CreateMonitor/utils/constants';
import { getDefaultScript } from '../../utils/helper';
import EnhancedAccordion from '../../../../components/FeatureAnywhereContextMenu/EnhancedAccordion';

class ConfigureTriggers extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dataTypes: {},
      executeResponse: null,
      isBucketLevelMonitor:
        _.get(props, 'monitor.monitor_type', MONITOR_TYPE.QUERY_LEVEL) ===
        MONITOR_TYPE.BUCKET_LEVEL,
      triggerDeleted: false,
      addTriggerButton: this.prepareAddTriggerButton(),
      triggerEmptyPrompt: this.prepareTriggerEmptyPrompt(),
      accordionsOpen: { trigger1: true },
      TriggerContainer: props.flyoutMode
        ? (props) => <EnhancedAccordion {...props} />
        : ({ children }) => <>{children}</>,
      ContentPanelStructure: props.flyoutMode ? ({ children }) => <>{children}</> : ContentPanel,
    };

    this.onQueryMappings = this.onQueryMappings.bind(this);
    this.onRunExecute = this.onRunExecute.bind(this);
    this.prepareAddTriggerButton = this.prepareAddTriggerButton.bind(this);
    this.prepareTriggerEmptyPrompt = this.prepareTriggerEmptyPrompt.bind(this);
  }

  componentDidMount() {
    const {
      monitorValues: { searchType, uri },
    } = this.props;
    const { isBucketLevelMonitor } = this.state;
    if (searchType === SEARCH_TYPE.CLUSTER_METRICS && canExecuteClusterMetricsMonitor(uri))
      this.onRunExecute();
    if (isBucketLevelMonitor) this.onQueryMappings();
  }

  componentDidUpdate(prevProps) {
    const prevMonitorType = _.get(prevProps, 'monitor.monitor_type', MONITOR_TYPE.QUERY_LEVEL);
    const currMonitorType = _.get(this.props, 'monitor.monitor_type', MONITOR_TYPE.QUERY_LEVEL);
    if (prevMonitorType !== currMonitorType)
      _.set(this.state, 'isBucketLevelMonitor', currMonitorType === MONITOR_TYPE.BUCKET_LEVEL);

    const prevSearchType = _.get(
      prevProps,
      'monitorValues.searchType',
      FORMIK_INITIAL_VALUES.searchType
    );
    const currSearchType = _.get(
      this.props,
      'monitorValues.searchType',
      FORMIK_INITIAL_VALUES.searchType
    );
    const prevApiType = _.get(
      prevProps,
      'monitorValues.uri.api_type',
      FORMIK_INITIAL_VALUES.uri.api_type
    );
    const currApiType = _.get(
      this.props,
      'monitorValues.uri.api_type',
      FORMIK_INITIAL_VALUES.uri.api_type
    );
    if (prevSearchType !== currSearchType || prevApiType !== currApiType) {
      this.setState({ addTriggerButton: this.prepareAddTriggerButton() });
      this.setState({ triggerEmptyPrompt: this.prepareTriggerEmptyPrompt() });
    }

    const prevInputs = prevProps.monitor.inputs[0];
    const currInputs = this.props.monitor.inputs[0];
    if (!_.isEqual(prevInputs, currInputs)) {
      const { isBucketLevelMonitor } = this.state;
      if (isBucketLevelMonitor) this.onQueryMappings();
    }
  }

  prepareAddTriggerButton = () => {
    const { monitorValues, triggerArrayHelpers, triggerValues, flyoutMode } = this.props;
    const disableAddTriggerButton =
      _.get(triggerValues, 'triggerDefinitions', []).length >= MAX_TRIGGERS;
    return (
      <AddTriggerButton
        arrayHelpers={triggerArrayHelpers}
        disabled={disableAddTriggerButton}
        script={getDefaultScript(monitorValues)}
        flyoutMode={flyoutMode}
      />
    );
  };

  prepareTriggerEmptyPrompt = () => {
    const { monitorValues, triggerArrayHelpers } = this.props;
    return (
      <TriggerEmptyPrompt
        arrayHelpers={triggerArrayHelpers}
        script={getDefaultScript(monitorValues)}
      />
    );
  };

  onRunExecute = (triggers = []) => {
    const { httpClient, monitor, notifications } = this.props;
    const formikValues = monitorToFormik(monitor);
    const searchType = formikValues.searchType;
    const monitorToExecute = _.cloneDeep(monitor);
    _.set(monitorToExecute, 'triggers', triggers);

    switch (searchType) {
      case SEARCH_TYPE.QUERY:
      case SEARCH_TYPE.GRAPH:
        const searchRequest = buildRequest(formikValues);
        _.set(monitorToExecute, 'inputs[0].search', searchRequest);
        break;
      case SEARCH_TYPE.CLUSTER_METRICS:
        const clusterMetricsRequest = buildClusterMetricsRequest(formikValues);
        _.set(monitorToExecute, 'inputs[0].uri', clusterMetricsRequest);
        break;
      default:
        console.log(`Unsupported searchType found: ${JSON.stringify(searchType)}`, searchType);
    }

    httpClient
      .post('../api/alerting/monitors/_execute', { body: JSON.stringify(monitorToExecute) })
      .then((resp) => {
        if (resp.ok) {
          this.setState({ executeResponse: resp.resp });
        } else {
          // TODO: need a notification system to show errors or banners at top
          console.error('err:', resp);
          backendErrorNotification(notifications, 'run', 'trigger', resp.resp);
        }
      })
      .catch((err) => {
        console.log('err:', err);
      });
  };

  async queryMappings(index) {
    if (!index.length) {
      return {};
    }

    try {
      const response = await this.props.httpClient.post('../api/alerting/_mappings', {
        body: JSON.stringify({ index }),
      });
      if (response.ok) {
        return response.resp;
      }
      return {};
    } catch (err) {
      throw err;
    }
  }

  async onQueryMappings() {
    const indices = this.props.monitor.inputs[0].search.indices;
    try {
      const mappings = await this.queryMappings(indices);
      const dataTypes = getPathsPerDataType(mappings);
      this.setState({ dataTypes });
    } catch (err) {
      console.error('There was an error getting mappings for query', err);
    }
  }

  getTriggerContext = (executeResponse, monitor, values) => {
    return {
      periodStart: moment.utc(_.get(executeResponse, 'period_start', Date.now())).format(),
      periodEnd: moment.utc(_.get(executeResponse, 'period_end', Date.now())).format(),
      results: [_.get(executeResponse, 'input_results.results[0]')].filter((result) => !!result),
      trigger: formikToTrigger(values, _.get(this.props.monitor, 'ui_metadata', {})),
      alert: null,
      error: null,
      monitor: monitor,
    };
  };

  renderDefineTrigger = (triggerArrayHelpers, index) => {
    const {
      edit,
      monitor,
      monitorValues,
      notifications,
      setFlyout,
      triggers,
      triggerValues,
      isDarkMode,
      httpClient,
      notificationService,
      plugins,
      flyoutMode,
    } = this.props;

    const { executeResponse } = this.state;
    return (
      <DefineTrigger
        edit={edit}
        triggerArrayHelpers={triggerArrayHelpers}
        context={this.getTriggerContext(executeResponse, monitor, triggerValues)}
        executeResponse={executeResponse}
        monitor={monitor}
        monitorValues={monitorValues}
        onRun={this.onRunExecute}
        setFlyout={setFlyout}
        triggers={triggers}
        triggerValues={triggerValues}
        isDarkMode={isDarkMode}
        triggerIndex={index}
        httpClient={httpClient}
        notifications={notifications}
        notificationService={notificationService}
        plugins={plugins}
        flyoutMode={flyoutMode}
      />
    );
  };

  renderDefineBucketLevelTrigger = (triggerArrayHelpers, index) => {
    const {
      edit,
      monitor,
      monitorValues,
      setFlyout,
      triggers,
      triggerValues,
      isDarkMode,
      httpClient,
      notifications,
      notificationService,
      plugins,
    } = this.props;
    const { dataTypes, executeResponse } = this.state;
    return (
      <DefineBucketLevelTrigger
        edit={edit}
        triggerArrayHelpers={triggerArrayHelpers}
        context={this.getTriggerContext(executeResponse, monitor, triggerValues)}
        executeResponse={executeResponse}
        monitor={monitor}
        monitorValues={monitorValues}
        onRun={this.onRunExecute}
        setFlyout={setFlyout}
        triggers={triggers}
        triggerValues={triggerValues}
        isDarkMode={isDarkMode}
        dataTypes={dataTypes}
        triggerIndex={index}
        httpClient={httpClient}
        notifications={notifications}
        notificationService={notificationService}
        plugins={plugins}
      />
    );
  };

  renderDefineDocumentLevelTrigger = (triggerArrayHelpers, index) => {
    const {
      edit,
      monitor,
      monitorValues,
      setFlyout,
      triggers,
      triggerValues,
      isDarkMode,
      httpClient,
      notifications,
      notificationService,
      plugins,
    } = this.props;
    const { dataTypes, executeResponse } = this.state;
    return (
      <DefineDocumentLevelTrigger
        edit={edit}
        triggerArrayHelpers={triggerArrayHelpers}
        context={this.getTriggerContext(executeResponse, monitor, triggerValues)}
        executeResponse={executeResponse}
        monitor={monitor}
        monitorValues={monitorValues}
        onRun={this.onRunExecute}
        setFlyout={setFlyout}
        triggers={triggers}
        triggerValues={triggerValues}
        isDarkMode={isDarkMode}
        dataTypes={dataTypes}
        triggerIndex={index}
        httpClient={httpClient}
        notifications={notifications}
        notificationService={notificationService}
        plugins={plugins}
      />
    );
  };

  renderTriggers = (triggerArrayHelpers) => {
    const { monitorValues, triggerValues, flyoutMode } = this.props;
    const { triggerEmptyPrompt, TriggerContainer, accordionsOpen } = this.state;
    const hasTriggers = !_.isEmpty(_.get(triggerValues, 'triggerDefinitions'));
    const onDelete = (index) => {
      console.log('delete', index);
    };

    const triggerContent = (arrayHelpers, index) => {
      switch (monitorValues.monitor_type) {
        case MONITOR_TYPE.BUCKET_LEVEL:
          return this.renderDefineBucketLevelTrigger(arrayHelpers, index);
        case MONITOR_TYPE.DOC_LEVEL:
          return this.renderDefineDocumentLevelTrigger(arrayHelpers, index);
        default:
          return this.renderDefineTrigger(arrayHelpers, index);
      }
    };

    return hasTriggers
      ? triggerValues.triggerDefinitions.map((trigger, index) => {
          const triggerKey = `trigger${index + 1}`;
          const name = trigger.name || `Trigger ${index + 1}`;
          return (
            <div key={triggerKey}>
              <TriggerContainer
                {...{
                  id: `configure-trigger__${triggerKey}`,
                  isOpen: accordionsOpen[triggerKey],
                  onToggle: () => this.onAccordionToggle(triggerKey),
                  title: (
                    <EuiFlexGroup alignItems="center" justifyContent="flexStart" gutterSize="s">
                      <EuiFlexItem grow={false}>{name}</EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiBadge color="hollow">SEV{trigger.severity}</EuiBadge>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  ),
                  extraAction: (
                    <EuiButtonIcon
                      iconType="trash"
                      color="text"
                      aria-label={`Delete ${name}`}
                      onClick={() => triggerArrayHelpers.remove(index)}
                    />
                  ),
                }}
              >
                {triggerContent(triggerArrayHelpers, index)}
              </TriggerContainer>
              {!flyoutMode && <EuiHorizontalRule margin={'s'} />}
              {flyoutMode && <EuiSpacer size="m" />}
            </div>
          );
        })
      : triggerEmptyPrompt;
  };

  onAccordionToggle = (key) => {
    const accordionsOpen = { ...this.state.accordionsOpen };
    accordionsOpen[key] = !accordionsOpen[key];
    this.setState({ accordionsOpen });
  };

  render() {
    const { triggerArrayHelpers, triggerValues, flyoutMode } = this.props;
    const { addTriggerButton, ContentPanelStructure } = this.state;
    const numOfTriggers = _.get(triggerValues, 'triggerDefinitions', []).length;
    const displayAddTriggerButton = numOfTriggers > 0;

    return (
      <ContentPanelStructure
        title={`Triggers (${numOfTriggers})`}
        titleSize={'s'}
        panelStyles={{ paddingBottom: '0px', paddingLeft: '20px', paddingRight: '20px' }}
        bodyStyles={{ paddingLeft: '0px', padding: '10px' }}
        horizontalRuleClassName={'accordion-horizontal-rule'}
      >
        {this.renderTriggers(triggerArrayHelpers)}

        {displayAddTriggerButton ? (
          <div style={flyoutMode ? {} : { paddingBottom: '20px', paddingTop: '15px' }}>
            {addTriggerButton}
            {!flyoutMode && (
              <>
                <EuiSpacer size={'s'} />
                {inputLimitText(numOfTriggers, MAX_TRIGGERS, 'trigger', 'triggers')}
              </>
            )}
          </div>
        ) : null}
      </ContentPanelStructure>
    );
  }
}

export default ConfigureTriggers;
