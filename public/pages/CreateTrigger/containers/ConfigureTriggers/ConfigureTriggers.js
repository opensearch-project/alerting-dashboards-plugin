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
  EuiSmallButtonIcon,
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
import DefineDocumentLevelTrigger from '../DefineDocumentLevelTrigger/DefineDocumentLevelTrigger';
import {
  buildClusterMetricsRequest,
  canExecuteClusterMetricsMonitor,
} from '../../../CreateMonitor/components/ClusterMetricsMonitor/utils/clusterMetricsMonitorHelpers';
import { FORMIK_INITIAL_VALUES } from '../../../CreateMonitor/containers/CreateMonitor/utils/constants';
import { getDefaultScript } from '../../utils/helper';
import DefineCompositeLevelTrigger from '../DefineCompositeLevelTrigger';
import EnhancedAccordion from '../../../../components/FeatureAnywhereContextMenu/EnhancedAccordion';
import { getDataSourceQueryObj } from '../../../../../public/pages/utils/helpers';

class ConfigureTriggers extends React.Component {
  constructor(props) {
    super(props);

    const firstTriggerId = _.get(props.triggerValues, 'triggerDefinitions[0].id');
    const startTriggerIndex = 0;
    const accordionsOpen = firstTriggerId ? { [startTriggerIndex]: true } : {};

    this.state = {
      dataTypes: {},
      executeResponse: null,
      triggerDeleted: false,
      addTriggerButton: this.prepareAddTriggerButton(),
      triggerEmptyPrompt: this.prepareTriggerEmptyPrompt(),
      currentSubmitCount: 0,
      accordionsOpen,
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
    this.monitorSetupByType();
  }

  componentDidUpdate(prevProps) {
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
    const prevMonitorType = _.get(
      prevProps,
      'monitorValues.monitor_type',
      FORMIK_INITIAL_VALUES.monitor_type
    );
    const currMonitorType = _.get(
      this.props,
      'monitorValues.monitor_type',
      FORMIK_INITIAL_VALUES.monitor_type
    );

    if (
      prevSearchType !== currSearchType ||
      prevApiType !== currApiType ||
      prevMonitorType !== currMonitorType
    ) {
      this.setState({ addTriggerButton: this.prepareAddTriggerButton() });
      this.setState({ triggerEmptyPrompt: this.prepareTriggerEmptyPrompt() });
    }

    const prevInputs = prevProps.monitor.inputs[0];
    const currInputs = this.props.monitor.inputs[0];
    if (!_.isEqual(prevInputs, currInputs)) this.monitorSetupByType();
  }

  monitorSetupByType = () => {
    const {
      monitor: { monitor_type },
      monitorValues: { uri },
    } = this.props;
    switch (monitor_type) {
      case MONITOR_TYPE.BUCKET_LEVEL:
        this.onQueryMappings();
        break;
      case MONITOR_TYPE.CLUSTER_METRICS:
        const numOfTriggers = _.get(this.props.triggerValues, 'triggerDefinitions', []).length;
        if (numOfTriggers > 0 && canExecuteClusterMetricsMonitor(uri)) this.onRunExecute();
        break;
    }
  };

  prepareAddTriggerButton = () => {
    const { monitorValues, triggerArrayHelpers, triggerValues } = this.props;
    const disableAddTriggerButton =
      _.get(triggerValues, 'triggerDefinitions', []).length >= MAX_TRIGGERS;
    return (
      <AddTriggerButton
        arrayHelpers={triggerArrayHelpers}
        disabled={disableAddTriggerButton}
        monitorType={monitorValues.monitor_type}
        script={getDefaultScript(monitorValues)}
      />
    );
  };

  prepareTriggerEmptyPrompt = () => {
    const { monitorValues, triggerArrayHelpers, flyoutMode } = this.props;
    return (
      <TriggerEmptyPrompt
        arrayHelpers={triggerArrayHelpers}
        monitorType={monitorValues.monitor_type}
        script={getDefaultScript(monitorValues)}
        flyoutMode={flyoutMode}
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
        _.set(monitorToExecute, 'inputs[0]', searchRequest);
        break;
      case SEARCH_TYPE.CLUSTER_METRICS:
        const clusterMetricsRequest = buildClusterMetricsRequest(formikValues);
        _.set(monitorToExecute, 'inputs[0].uri', clusterMetricsRequest);
        break;
      default:
        console.log(`Unsupported searchType found: ${JSON.stringify(searchType)}`, searchType);
    }

    const dataSourceQuery = getDataSourceQueryObj();
    httpClient
      .post('../api/alerting/monitors/_execute', {
        body: JSON.stringify(monitorToExecute),
        query: dataSourceQuery?.query,
      })
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
      const dataSourceQuery = getDataSourceQueryObj();
      const response = await this.props.httpClient.post('../api/alerting/_mappings', {
        body: JSON.stringify({ index }),
        query: dataSourceQuery?.query,
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
    const indices = this.props.monitor.inputs[0].search?.indices || [];
    try {
      const mappings = await this.queryMappings(indices);
      const dataTypes = getPathsPerDataType(mappings);
      this.setState({ dataTypes });
    } catch (err) {
      console.error('There was an error getting mappings for query', err);
    }
  }

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
      submitCount,
      errors,
    } = this.props;
    const { executeResponse } = this.state;
    return (
      <DefineTrigger
        edit={edit}
        triggerArrayHelpers={triggerArrayHelpers}
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
        submitCount={submitCount}
        errors={errors}
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

  renderCompositeLevelTrigger = (triggerArrayHelpers, index) => {
    const {
      edit,
      monitorValues,
      isDarkMode,
      httpClient,
      notifications,
      notificationService,
      plugins,
      touched,
    } = this.props;
    return (
      <DefineCompositeLevelTrigger
        triggerArrayHelpers={triggerArrayHelpers}
        triggerIndex={index}
        edit={edit}
        values={monitorValues}
        touched={touched}
        isDarkMode={isDarkMode}
        httpClient={httpClient}
        notifications={notifications}
        notificationService={notificationService}
        plugins={plugins}
      />
    );
  };

  renderTriggers = (triggerArrayHelpers) => {
    const { monitorValues, triggerValues, flyoutMode, errors, submitCount } = this.props;
    const { triggerEmptyPrompt, TriggerContainer, accordionsOpen, currentSubmitCount } = this.state;
    const hasTriggers = !_.isEmpty(_.get(triggerValues, 'triggerDefinitions'));

    const triggerContent = (arrayHelpers, index) => {
      switch (monitorValues.monitor_type) {
        case MONITOR_TYPE.BUCKET_LEVEL:
          return this.renderDefineBucketLevelTrigger(arrayHelpers, index);
        case MONITOR_TYPE.DOC_LEVEL:
          return this.renderDefineDocumentLevelTrigger(arrayHelpers, index);
        case MONITOR_TYPE.COMPOSITE_LEVEL:
          return this.renderCompositeLevelTrigger(arrayHelpers, index);
        default:
          return this.renderDefineTrigger(arrayHelpers, index);
      }
    };

    if (flyoutMode && submitCount > currentSubmitCount) {
      for (let index in errors.triggerDefinitions) {
        accordionsOpen[index] = !_.isEmpty(errors.triggerDefinitions[index]);
      }
    }

    return hasTriggers
      ? triggerValues.triggerDefinitions.map((trigger, index) => (
          <div key={trigger.id}>
            <TriggerContainer
              {...{
                id: `configure-trigger__${trigger.id}`,
                isOpen: accordionsOpen[index],
                onToggle: () => this.onAccordionToggle(index),
                title: (
                  <EuiFlexGroup alignItems="center" justifyContent="flexStart" gutterSize="s">
                    <EuiFlexItem grow={false}>{trigger.name}</EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiBadge color="hollow">SEV{trigger.severity}</EuiBadge>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                ),
                extraAction: (
                  <EuiSmallButtonIcon
                    iconType="trash"
                    color="text"
                    aria-label={`Delete ${trigger.name}`}
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
        ))
      : !flyoutMode && triggerEmptyPrompt;
  };

  onAccordionToggle = (key, isOnlyOpen) => {
    let accordionsOpen = isOnlyOpen ? {} : { ...this.state.accordionsOpen };
    accordionsOpen[key] = !accordionsOpen[key];
    this.setState({ accordionsOpen, currentSubmitCount: this.props.submitCount });
  };

  render() {
    const { triggerArrayHelpers, triggerValues, flyoutMode, monitorValues } = this.props;
    const { ContentPanelStructure } = this.state;
    const numOfTriggers = _.get(triggerValues, 'triggerDefinitions', []).length;
    const displayAddTriggerButton = numOfTriggers > 0;
    const disableAddTriggerButton = numOfTriggers >= MAX_TRIGGERS;
    const monitorType = monitorValues.monitor_type;
    const isComposite = monitorType === MONITOR_TYPE.COMPOSITE_LEVEL;

    return (
      <ContentPanelStructure
        title={`Triggers (${numOfTriggers})`}
        titleSize={'s'}
        description={
          isComposite
            ? 'Triggers define the conditions that determine when a composite monitor should generate its own alert.'
            : undefined
        }
        panelStyles={{ paddingBottom: '0px', paddingLeft: '20px', paddingRight: '20px' }}
        bodyStyles={{ paddingLeft: '0px', padding: '10px' }}
        horizontalRuleClassName={'accordion-horizontal-rule'}
      >
        {this.renderTriggers(triggerArrayHelpers)}
        {flyoutMode && !disableAddTriggerButton && (
          <AddTriggerButton
            arrayHelpers={triggerArrayHelpers}
            disabled={disableAddTriggerButton}
            script={getDefaultScript(monitorValues)}
            flyoutMode={flyoutMode}
            monitorType={monitorType}
            onPostAdd={(values) => this.onAccordionToggle(numOfTriggers, true)}
          />
        )}
        {displayAddTriggerButton && !flyoutMode ? (
          <div style={{ paddingBottom: '20px', paddingTop: '15px' }}>
            <AddTriggerButton
              arrayHelpers={triggerArrayHelpers}
              disabled={disableAddTriggerButton}
              script={getDefaultScript(monitorValues)}
              monitorType={monitorType}
            />
            <EuiSpacer size={'s'} />
            {inputLimitText(numOfTriggers, MAX_TRIGGERS, 'trigger', 'triggers')}
          </div>
        ) : null}
      </ContentPanelStructure>
    );
  }
}

export default ConfigureTriggers;
