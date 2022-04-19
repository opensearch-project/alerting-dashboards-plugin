/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { FieldArray } from 'formik';
import {
  EuiAccordion,
  EuiButton,
  EuiButtonEmpty,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { FormikFieldText, FormikSelect } from '../../../../components/FormControls';
import { hasError, isInvalid } from '../../../../utils/validate';
import { SEARCH_TYPE } from '../../../../utils/constants';
import { DEFAULT_TRIGGER_NAME, SEVERITY_OPTIONS } from '../../utils/constants';
import { validateTriggerName } from '../DefineTrigger/utils/validation';
import ConfigureActions from '../ConfigureActions';
import TriggerQuery from '../../components/TriggerQuery';
import {
  FORMIK_INITIAL_TRIGGER_CONDITION_VALUES,
  TRIGGER_TYPE,
} from '../CreateTrigger/utils/constants';
import DocumentLevelTriggerExpression from './DocumentLevelTriggerExpression';
import { backendErrorNotification, inputLimitText } from '../../../../utils/helpers';
import monitorToFormik from '../../../CreateMonitor/containers/CreateMonitor/utils/monitorToFormik';
import { buildRequest } from '../../../CreateMonitor/containers/DefineMonitor/utils/searchRequests';

const MAX_TRIGGER_CONDITIONS = 5; // TODO DRAFT: Placeholder limit

const defaultRowProps = {
  label: 'Trigger name',
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
  style: { paddingLeft: '10px', marginTop: '0px' },
  isInvalid,
  error: hasError,
};

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
};

export const QUERY_IDENTIFIERS = {
  ID: 'id=',
  NAME: 'name=',
  TAG: 'tag=',
};

class DefineDocumentLevelTrigger extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  onRunExecute = (triggers = []) => {
    const { httpClient, monitor, notifications } = this.props;
    const formikValues = monitorToFormik(monitor);
    const searchType = formikValues.searchType;
    const docLevelTriggers = triggers.map((trigger) => ({ [TRIGGER_TYPE.DOC_LEVEL]: trigger }));
    const monitorToExecute = _.cloneDeep(monitor);
    _.set(monitorToExecute, 'triggers', docLevelTriggers);

    switch (searchType) {
      case SEARCH_TYPE.QUERY:
      case SEARCH_TYPE.GRAPH:
        const request = buildRequest(formikValues);
        _.set(monitorToExecute, 'inputs[0]', request);
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

  renderDocumentLevelTriggerGraph = (
    arrayHelpers,
    fieldPath,
    monitor,
    monitorValues,
    response,
    triggerValues
  ) => {
    const queries = _.get(monitorValues, 'queries', []);
    const tagSelectOptions = [];
    const querySelectOptions = queries.map((query) => {
      query.tags.forEach((tag) => {
        const tagOption = {
          label: tag,
          value: { queryName: tag, operator: '==', expression: `${QUERY_IDENTIFIERS.TAG}${tag}` },
        };
        if (!_.includes(tagSelectOptions, tagOption)) tagSelectOptions.push(tagOption);
      });
      return {
        label: query.queryName,
        value: { ...query, expression: `${QUERY_IDENTIFIERS.NAME}${query.queryName}` },
      };
    });

    const triggerConditions = _.get(triggerValues, `${fieldPath}triggerConditions`, []);
    if (_.isEmpty(triggerConditions)) {
      arrayHelpers.push(_.cloneDeep(FORMIK_INITIAL_TRIGGER_CONDITION_VALUES));
    }

    return triggerConditions.map((triggerCondition, index) => (
      <div key={`${fieldPath}triggerConditions.${index}`} style={{ paddingLeft: '10px' }}>
        <DocumentLevelTriggerExpression
          arrayHelpers={arrayHelpers}
          formFieldName={`${fieldPath}triggerConditions.${index}`}
          index={index}
          querySelectOptions={querySelectOptions}
          tagSelectOptions={tagSelectOptions}
          values={triggerCondition}
        />
      </div>
    ));
  };

  render() {
    const {
      edit,
      triggerArrayHelpers,
      context,
      monitor,
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
    } = this.props;
    const executeResponse = _.get(this.state, 'executeResponse', this.props.executeResponse);
    const fieldPath = triggerIndex !== undefined ? `triggerDefinitions[${triggerIndex}].` : '';
    const isGraph = _.get(monitorValues, 'searchType') === SEARCH_TYPE.GRAPH;
    const response = _.get(executeResponse, 'input_results.results[0]');
    const error = _.get(executeResponse, 'error') || _.get(executeResponse, 'input_results.error');
    const triggerName = _.get(triggerValues, `${fieldPath}name`, DEFAULT_TRIGGER_NAME);

    const disableAddTriggerConditionButton =
      _.get(triggerValues, `${fieldPath}triggerConditions`, []).length >= MAX_TRIGGER_CONDITIONS;

    const triggerContent = isGraph ? (
      <FieldArray name={`${fieldPath}triggerConditions`} validateOnChange={true}>
        {(conditionsArrayHelpers) => (
          <div>
            <div style={{ paddingLeft: '10px', paddingTop: '10px' }}>
              <EuiText>
                <h4>Trigger conditions</h4>
              </EuiText>
              <EuiText color={'subdued'} size={'xs'}>
                Triggers on documents that match the following conditions
              </EuiText>
            </div>

            <EuiSpacer size={'s'} />

            {this.renderDocumentLevelTriggerGraph(
              conditionsArrayHelpers,
              fieldPath,
              monitor,
              monitorValues,
              response,
              triggerValues
            )}

            <EuiSpacer size={'s'} />

            <EuiButtonEmpty
              onClick={() =>
                conditionsArrayHelpers.push(_.cloneDeep(FORMIK_INITIAL_TRIGGER_CONDITION_VALUES))
              }
              disabled={disableAddTriggerConditionButton}
              size={'xs'}
            >
              + Add condition
            </EuiButtonEmpty>
            {inputLimitText(
              _.get(triggerValues, `${fieldPath}triggerConditions`, []).length,
              MAX_TRIGGER_CONDITIONS,
              'trigger condition',
              'trigger conditions',
              { paddingLeft: '10px' }
            )}
          </div>
        )}
      </FieldArray>
    ) : (
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
        isAd={false}
      />
    );

    return (
      <EuiAccordion
        id={triggerName}
        buttonContent={
          <EuiTitle size={'s'}>
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
        <div style={{ padding: '0px 10px', paddingTop: '10px' }}>
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

          {triggerContent}

          <EuiSpacer size={'l'} />
          <div style={{ paddingLeft: '10px', paddingRight: '10px' }}>
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
        </div>
      </EuiAccordion>
    );
  }
}

DefineDocumentLevelTrigger.propTypes = propTypes;

export default DefineDocumentLevelTrigger;
