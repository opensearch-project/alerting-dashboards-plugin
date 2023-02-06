/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { EuiAccordion, EuiButton, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import 'brace/mode/plain_text';
import { FormikFieldText, FormikSelect } from '../../../../components/FormControls';
import { isInvalid, hasError } from '../../../../utils/validate';
import TriggerQuery from '../../components/TriggerQuery';
import TriggerGraph from '../../components/TriggerGraph';
import { validateTriggerName } from './utils/validation';
import { SEARCH_TYPE } from '../../../../utils/constants';
import { AnomalyDetectorTrigger } from './AnomalyDetectorTrigger';
import { TRIGGER_TYPE } from '../CreateTrigger/utils/constants';
import { FieldArray } from 'formik';
import ConfigureActions from '../ConfigureActions';
import monitorToFormik from '../../../CreateMonitor/containers/CreateMonitor/utils/monitorToFormik';
import { buildRequest } from '../../../CreateMonitor/containers/DefineMonitor/utils/searchRequests';
import { backendErrorNotification } from '../../../../utils/helpers';
import {
  buildClusterMetricsRequest,
  canExecuteClusterMetricsMonitor,
} from '../../../CreateMonitor/components/ClusterMetricsMonitor/utils/clusterMetricsMonitorHelpers';
import { DEFAULT_TRIGGER_NAME, SEVERITY_OPTIONS } from '../../utils/constants';

const defaultRowProps = {
  label: 'Trigger name',
  // helpText: `Trigger names must be unique. Names can only contain letters, numbers, and special characters.`,
  style: { paddingLeft: '10px' },
  isInvalid,
  error: hasError,
};

const defaultInputProps = { isInvalid };

const selectFieldProps = {
  validate: () => {},
};

const selectRowProps = {
  label: 'Severity level',
  // helpText: `Severity levels help you organize your triggers and actions. A trigger with a high severity level might page a specific individual, whereas a trigger with a low severity level might email a list.`,
  style: { paddingLeft: '10px', marginTop: '0px' },
  isInvalid,
  error: hasError,
};

const triggerOptions = [
  { value: TRIGGER_TYPE.AD, text: 'Anomaly detector grade and confidence' },
  { value: TRIGGER_TYPE.ALERT_TRIGGER, text: 'Extraction query response' },
];

const selectInputProps = {
  options: SEVERITY_OPTIONS,
};

const propTypes = {
  context: PropTypes.object.isRequired,
  executeResponse: PropTypes.object,
  monitorValues: PropTypes.object.isRequired,
  onRun: PropTypes.func.isRequired,
  setFlyout: PropTypes.func.isRequired,
  triggers: PropTypes.arrayOf(PropTypes.object).isRequired,
  triggerValues: PropTypes.object.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  isMinimal: PropTypes.bool,
};

const defaultProps = {
  isMinimal: false,
};

class DefineTrigger extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  // TODO query-level monitor trigger graph only get the input
  //  when this component mount (new trigger added)
  //  see how to subscribe the formik related value change
  componentDidMount() {
    const {
      monitorValues: { searchType, uri },
    } = this.props;
    switch (searchType) {
      case SEARCH_TYPE.CLUSTER_METRICS:
        if (canExecuteClusterMetricsMonitor(uri)) this.onRunExecute();
        break;
      default:
        this.onRunExecute();
    }
  }

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
      case SEARCH_TYPE.AD:
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

  render() {
    const {
      edit,
      triggerArrayHelpers,
      context,
      monitorValues,
      onRun,
      setFlyout,
      triggers,
      triggerValues,
      isDarkMode,
      triggerIndex,
      httpClient,
      notifications,
      notificationService,
      plugins,
      isMinimal,
    } = this.props;
    const executeResponse = _.get(this.state, 'executeResponse', this.props.executeResponse);
    const fieldPath = triggerIndex !== undefined ? `triggerDefinitions[${triggerIndex}].` : '';
    const isGraph = _.get(monitorValues, 'searchType') === SEARCH_TYPE.GRAPH;
    const isAd = _.get(monitorValues, 'searchType') === SEARCH_TYPE.AD;
    const detectorId = _.get(monitorValues, 'detectorId');
    const response = _.get(executeResponse, 'input_results.results[0]');
    const error = _.get(executeResponse, 'error') || _.get(executeResponse, 'input_results.error');
    const thresholdEnum = _.get(triggerValues, `${fieldPath}thresholdEnum`);
    const thresholdValue = _.get(triggerValues, `${fieldPath}thresholdValue`);
    const adTriggerType = _.get(triggerValues, `${fieldPath}anomalyDetector.triggerType`);
    const triggerName = _.get(triggerValues, `${fieldPath}name`, DEFAULT_TRIGGER_NAME);

    let triggerContent = (
      <TriggerQuery
        context={context}
        error={error}
        executeResponse={executeResponse}
        onRun={_.isEmpty(fieldPath) ? onRun : this.onRunExecute}
        response={response}
        setFlyout={setFlyout}
        triggerValues={triggerValues}
        isDarkMode={isDarkMode}
        fieldPath={fieldPath}
        isAd={isAd}
      />
    );
    if (isAd && adTriggerType === TRIGGER_TYPE.AD) {
      const adValues = _.get(triggerValues, `${fieldPath}anomalyDetector`);
      triggerContent = (
        <AnomalyDetectorTrigger detectorId={detectorId} adValues={adValues} fieldPath={fieldPath} />
      );
    }
    if (isGraph) {
      triggerContent = isMinimal ? null : (
        <TriggerGraph
          monitorValues={monitorValues}
          response={response}
          thresholdEnum={thresholdEnum}
          thresholdValue={thresholdValue}
          fieldPath={fieldPath}
        />
      );
    }

    return (
      <EuiAccordion
        id={triggerName}
        buttonContent={
          <EuiTitle size={'s'} data-test-subj={`${fieldPath}_triggerAccordion`}>
            <h1>{_.isEmpty(triggerName) ? DEFAULT_TRIGGER_NAME : triggerName}</h1>
          </EuiTitle>
        }
        initialIsOpen={edit ? false : triggerIndex === 0}
        extraAction={
          <EuiButton
            color={'danger'}
            onClick={() => {
              triggerArrayHelpers.remove(triggerIndex);
            }}
            size={'s'}
          >
            Remove trigger
          </EuiButton>
        }
        style={{ paddingBottom: '15px', paddingTop: '10px' }}
      >
        <div style={{ padding: '0px 20px', paddingTop: '20px' }}>
          <FormikFieldText
            name={`${fieldPath}name`}
            fieldProps={{ validate: validateTriggerName(triggers, triggerValues, fieldPath) }}
            formRow
            rowProps={defaultRowProps}
            inputProps={defaultInputProps}
          />
          <EuiSpacer size={'m'} />
          <FormikSelect
            name={`${fieldPath}severity`}
            formRow
            fieldProps={selectFieldProps}
            rowProps={selectRowProps}
            inputProps={selectInputProps}
          />
          <EuiSpacer size={'m'} />

          {isAd ? (
            <div style={{ paddingLeft: '10px', marginTop: '0px' }}>
              <EuiText size={'xs'} style={{ paddingBottom: '0px', marginBottom: '0px' }}>
                <h4>Trigger type</h4>
              </EuiText>
              <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '5px' }}>
                Define type of anomaly detector trigger
              </EuiText>
              <FormikSelect
                name={`${fieldPath}anomalyDetector.triggerType`}
                formRow
                rowProps={{ style: { paddingTop: '0px', marginTop: '0px', width: '390px' } }}
                inputProps={{ options: triggerOptions }}
              />
              <EuiSpacer size={'m'} />
            </div>
          ) : null}

          {triggerContent}

          <EuiSpacer size={'l'} />
          <FieldArray name={`${fieldPath}actions`} validateOnChange={true}>
            {(arrayHelpers) => (
              <ConfigureActions
                arrayHelpers={arrayHelpers}
                context={context}
                httpClient={httpClient}
                setFlyout={setFlyout}
                values={triggerValues}
                notifications={notifications}
                fieldPath={fieldPath}
                triggerIndex={triggerIndex}
                notificationService={notificationService}
                plugins={plugins}
              />
            )}
          </FieldArray>
        </div>
      </EuiAccordion>
    );
  }
}

DefineTrigger.propTypes = propTypes;
DefineTrigger.defaultProps = defaultProps;

export default DefineTrigger;
