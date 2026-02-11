/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  EuiAccordion,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSelect,
  EuiFieldText,
  EuiFieldNumber,
  EuiCheckbox,
  EuiFormRow,
  EuiRadioGroup,
  EuiPanel,
} from '@elastic/eui';
import { Field, FieldArray } from 'formik';
import 'brace/mode/plain_text';
import './DefineTriggerPpl.scss';

import {
  FormikFieldText,
  FormikSelect,
  FormikFieldNumber,
} from '../../../../components/FormControls';
import { isInvalid, hasError } from '../../../../utils/validate';
import { validateTriggerName, validateNumResultsValue } from './utils/validation';
import { OS_NOTIFICATION_PLUGIN } from '../../../../utils/constants';
import ConfigureActionsPpl from '../ConfigureActions/ConfigureActionsPpl';
import TriggerGraphPpl from '../../components/TriggerGraphPpl';
import { DEFAULT_TRIGGER_NAME } from '../../utils/constants';
import MinimalAccordion from '../../../../components/FeatureAnywhereContextMenu/MinimalAccordion';
import { getTriggerContext } from '../../utils/helper';

const GRID_MAX = 720;
const GRID_PAD = 10;
const SECTION_WIDTH = { paddingLeft: GRID_PAD, maxWidth: GRID_MAX };
const twoColRowStyle = SECTION_WIDTH;
const twoColRowProps = {
  gutterSize: 'm',
  responsive: false,
  alignItems: 'flexEnd',
  style: twoColRowStyle,
};
const HALF_COL = { flexBasis: '50%', minWidth: 0 };

const defaultRowProps = {
  label: 'Trigger name',
  style: SECTION_WIDTH,
  fullWidth: true,
  isInvalid,
  error: hasError,
};

const defaultInputProps = { isInvalid, fullWidth: true };
const selectFieldProps = { validate: () => {} };

const PPL_SEVERITY_OPTIONS = [
  { value: 'critical', text: 'Critical' },
  { value: 'high', text: 'High' },
  { value: 'medium', text: 'Medium' },
  { value: 'low', text: 'Low' },
  { value: 'info', text: 'Info' },
  { value: 'error', text: 'Error' },
];

const TYPE_OPTIONS = [
  { value: 'number_of_results', text: 'Number of results' },
  { value: 'custom', text: 'Custom' },
];

const DURATION_OPTIONS = [
  { value: 'minutes', text: 'minute(s)' },
  { value: 'hours', text: 'hour(s)' },
  { value: 'days', text: 'day(s)' },
];

const NUMBER_OF_RESULTS_OPERATOR_OPTIONS = [
  { value: '>', text: 'Greater than' },
  { value: '>=', text: 'Greater than or equal to' },
  { value: '<', text: 'Less than' },
  { value: '<=', text: 'Less than or equal to' },
  { value: '==', text: 'Equal to' },
  { value: '!=', text: 'Not equal to' },
];

const THROTTLE_DEFAULT = { value: '', unit: 'minutes' };
const EXPIRES_DEFAULT = { value: 7, unit: 'days' };

class DefineTriggerPpl extends Component {
  constructor(props) {
    super(props);
    this.state = {
      OuterAccordion: props.flyoutMode ? ({ children }) => <>{children}</> : EuiAccordion,
      currentSubmitCount: 0,
      accordionsOpen: {},
    };
  }

  renderModeSelector(fieldPath) {
    const containerStyle = this.props.flyoutMode ? {} : SECTION_WIDTH;
    return (
      <Field name={`${fieldPath}mode`}>
        {({ field, form }) => (
          <div style={containerStyle}>
            <EuiFormRow
              label="Trigger"
              fullWidth
              labelProps={{
                onClick: (e) => e.preventDefault(),
                style: { pointerEvents: 'none', cursor: 'default' },
              }}
            >
              <EuiRadioGroup
                options={[
                  { id: 'result_set', label: 'Once' },
                  { id: 'per_result', label: 'For each result' },
                ]}
                idSelected={field.value === 'per_result' ? 'per_result' : 'result_set'}
                onChange={(id) => form.setFieldValue(`${fieldPath}mode`, id)}
              />
            </EuiFormRow>
          </div>
        )}
      </Field>
    );
  }

  renderNumberConditionFields(fieldPath) {
    const widthStyle = this.props.flyoutMode ? {} : SECTION_WIDTH;

    return (
      <div style={widthStyle}>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexEnd">
          <EuiFlexItem>
            <FormikSelect
              name={`${fieldPath}num_results_condition`}
              formRow
              fieldProps={selectFieldProps}
              rowProps={{
                label: 'Trigger condition',
                fullWidth: true,
                style: { paddingLeft: 0 },
              }}
              inputProps={{
                options: NUMBER_OF_RESULTS_OPERATOR_OPTIONS,
                fullWidth: true,
                onChange: (e, field, form) => {
                  field.onChange(e);
                  // Trigger validation on the value field when condition changes
                  setTimeout(() => {
                    form.validateField(`${fieldPath}num_results_value`);
                  }, 0);
                },
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <Field
              name={`${fieldPath}num_results_value`}
              validate={(value, formValues) => {
                const type = _.get(formValues, `${fieldPath}type`, 'number_of_results');
                const condition = _.get(formValues, `${fieldPath}num_results_condition`, '>=');

                if (type === 'number_of_results' && (condition === '>=' || condition === '>')) {
                  const numValue = Number(value);
                  if (!isNaN(numValue) && numValue >= 10000) {
                    return 'Value cannot be greater than or equal to 10000.';
                  }
                  if (value !== null && value !== undefined && value !== '') {
                    const strValue = String(value).trim();
                    if (strValue.startsWith('-')) {
                      return 'Value cannot be negative.';
                    }
                    if (!isNaN(numValue) && numValue < 0) {
                      return 'Value cannot be negative.';
                    }
                  }
                }
              }}
            >
              {({ field, form, meta }) => (
                <div style={{ position: 'relative', width: '100%' }}>
                  <FormikFieldNumber
                    name={`${fieldPath}num_results_value`}
                    formRow
                    fieldProps={{}}
                    rowProps={{
                      label: '',
                      hasEmptyLabelSpace: true,
                      fullWidth: true,
                      style: { paddingLeft: 0 },
                      isInvalid: meta.error ? true : false,
                      error: undefined,
                    }}
                    inputProps={{ min: 0, fullWidth: true, isInvalid: meta.error ? true : false }}
                  />
                  {meta.error && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        fontSize: '12px',
                        color: '#D13212',
                        marginTop: '2px',
                        lineHeight: '1.5',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 10,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {meta.error}
                    </div>
                  )}
                </div>
              )}
            </Field>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }

  renderThrottleFields(fieldPath) {
    const widthStyle = this.props.flyoutMode ? {} : SECTION_WIDTH;
    return (
      <div style={widthStyle}>
        <EuiText size="xs" style={{ marginBottom: 4 }}>
          <strong>Throttle for</strong>
        </EuiText>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexEnd">
          <EuiFlexItem>
            <FormikFieldNumber
              name={`${fieldPath}suppress.value`}
              formRow
              rowProps={{
                hasEmptyLabelSpace: true,
                fullWidth: true,
                style: { paddingLeft: 0, marginTop: 0 },
              }}
              inputProps={{ min: 1, fullWidth: true }}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <FormikSelect
              name={`${fieldPath}suppress.unit`}
              formRow
              fieldProps={selectFieldProps}
              rowProps={{
                hasEmptyLabelSpace: true,
                fullWidth: true,
                style: { paddingLeft: 0, marginTop: 0 },
              }}
              inputProps={{ options: DURATION_OPTIONS, fullWidth: true }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }

  renderExpiresFields(fieldPath) {
    const widthStyle = this.props.flyoutMode ? {} : SECTION_WIDTH;
    return (
      <div style={widthStyle}>
        <EuiText size="xs" style={{ marginBottom: 4 }}>
          <strong>Expires</strong>
        </EuiText>
        <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexEnd">
          <EuiFlexItem>
            <FormikFieldNumber
              name={`${fieldPath}expires.value`}
              formRow
              rowProps={{
                hasEmptyLabelSpace: true,
                fullWidth: true,
                style: { paddingLeft: 0, marginTop: 0 },
              }}
              inputProps={{ min: 1, fullWidth: true }}
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <FormikSelect
              name={`${fieldPath}expires.unit`}
              formRow
              fieldProps={selectFieldProps}
              rowProps={{
                hasEmptyLabelSpace: true,
                fullWidth: true,
                style: { paddingLeft: 0, marginTop: 0 },
              }}
              inputProps={{ options: DURATION_OPTIONS, fullWidth: true }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }

  renderCustomCondition({ fieldPath, onUpdate }) {
    const widthStyle = this.props.flyoutMode ? {} : SECTION_WIDTH;
    return (
      <div style={widthStyle}>
        <EuiFormRow label="Trigger condition" fullWidth>
          <>
            <EuiText size="xs" color="subdued" style={{ marginBottom: 8 }}>
              Add a custom condition to append to your existing query.
            </EuiText>
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem>
                <Field name={`${fieldPath}custom_condition`}>
                  {({ field, form }) => (
                    <EuiFieldText
                      {...field}
                      value={field.value != null ? field.value : ''}
                      fullWidth
                      placeholder="eg: eval result = count > 3"
                      onChange={(e) =>
                        form.setFieldValue(`${fieldPath}custom_condition`, e.target.value)
                      }
                    />
                  )}
                </Field>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton size="s" onClick={onUpdate} data-test-subj="updateResultsButton">
                  Update results
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        </EuiFormRow>
      </div>
    );
  }

  render() {
    const { OuterAccordion, accordionsOpen, currentSubmitCount } = this.state;
    const {
      edit,
      triggerArrayHelpers,
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
      flyoutMode,
      submitCount,
      errors,
      previewError,
    } = this.props;
    const hasNotificationPlugin = plugins.indexOf(OS_NOTIFICATION_PLUGIN) !== -1;
    const executeResponse = this.props.executeResponse;
    const context = getTriggerContext(executeResponse, monitor, triggerValues, triggerIndex);
    const fieldPath = triggerIndex !== undefined ? `triggerDefinitions[${triggerIndex}].` : '';
    const triggerName = _.get(triggerValues, `${fieldPath}name`, DEFAULT_TRIGGER_NAME);
    const type = _.get(triggerValues, `${fieldPath}type`, 'number_of_results');
    const widthStyle = flyoutMode ? {} : SECTION_WIDTH;
    const throttleEnabled = !!_.get(triggerValues, `${fieldPath}throttle_enabled`, false);
    const customConditionValue = _.get(triggerValues, `${fieldPath}custom_condition`, '');
    const graphErrorMessage = executeResponse?.ok === false ? executeResponse.error : null;
    const handleCustomConditionUpdate = () => {
      if (typeof onRun === 'function') {
        onRun({ ...monitorValues, customCondition: customConditionValue });
      }
    };
    if (flyoutMode && submitCount > currentSubmitCount) {
      accordionsOpen.triggerCondition =
        accordionsOpen?.metrics ||
        (errors.triggerDefinitions?.[triggerIndex] &&
          'name' in errors.triggerDefinitions?.[triggerIndex]);
    }

    return (
      <OuterAccordion
        id={triggerName}
        buttonContent={
          <EuiTitle size={'s'} data-test-subj={`${fieldPath}_triggerAccordion`}>
            <h1>{_.isEmpty(triggerName) ? DEFAULT_TRIGGER_NAME : triggerName}</h1>
          </EuiTitle>
        }
        initialIsOpen={edit ? false : triggerIndex === 0}
        extraAction={
          !flyoutMode && (
            <EuiButtonEmpty
              color="danger"
              size="s"
              style={{ border: '1px solid #D3DAE6', borderRadius: '6px' }}
              onClick={() => {
                triggerArrayHelpers.remove(triggerIndex);
              }}
            >
              Remove trigger
            </EuiButtonEmpty>
          )
        }
        style={{ paddingBottom: '15px', paddingTop: '10px' }}
      >
        <div
          className="define-trigger-ppl"
          style={flyoutMode ? {} : { padding: '0px 20px', paddingTop: '20px' }}
        >
          <FormikFieldText
            name={`${fieldPath}name`}
            fieldProps={{
              validate: (val) =>
                validateTriggerName(
                  triggerValues?.triggerDefinitions,
                  triggerIndex,
                  flyoutMode
                )(val),
            }}
            formRow
            rowProps={{ ...defaultRowProps, style: widthStyle }}
            inputProps={defaultInputProps}
          />

          <EuiSpacer size="m" />
          <div style={widthStyle}>
            <EuiFlexGroup gutterSize="s" responsive={false} alignItems="flexEnd">
              <EuiFlexItem>
                <FormikSelect
                  name={`${fieldPath}severity`}
                  formRow
                  fieldProps={selectFieldProps}
                  rowProps={{
                    label: 'Severity level',
                    fullWidth: true,
                    style: { paddingLeft: 0 },
                  }}
                  inputProps={{ options: PPL_SEVERITY_OPTIONS, fullWidth: true }}
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <FormikSelect
                  name={`${fieldPath}type`}
                  formRow
                  fieldProps={selectFieldProps}
                  rowProps={{
                    label: 'Type',
                    fullWidth: true,
                    style: { paddingLeft: 0 },
                  }}
                  inputProps={{ options: TYPE_OPTIONS, fullWidth: true }}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>

          {type === 'custom' && (
            <>
              <EuiSpacer size="m" />
              {this.renderCustomCondition({ fieldPath, onUpdate: handleCustomConditionUpdate })}
            </>
          )}

          {type === 'number_of_results' && (
            <>
              <EuiSpacer size="m" />
              {this.renderNumberConditionFields(fieldPath)}
            </>
          )}

          <EuiSpacer size="m" />
          {this.renderModeSelector(fieldPath)}

          <EuiSpacer size="m" />
          <div style={widthStyle}>
            <EuiPanel paddingSize="none" style={{ padding: '18px 24px 24px', borderRadius: '8px' }}>
              <EuiFlexGroup
                justifyContent="spaceBetween"
                alignItems="center"
                gutterSize="none"
                responsive={false}
              >
                <EuiFlexItem grow={false}>
                  <EuiText size="s" style={{ marginLeft: 4, marginBottom: 4 }}>
                    <strong>Results</strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ marginLeft: '8px' }}>
                  <EuiButton
                    size="s"
                    onClick={() => {
                      if (typeof onRun === 'function') {
                        onRun(monitorValues);
                      }
                    }}
                    data-test-subj="updateTriggerGraphButton"
                    compressed
                  >
                    Update
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
              <TriggerGraphPpl
                monitorValues={monitorValues}
                response={
                  _.get(executeResponse, 'input_results.results[0]') || {
                    aggregations: { ppl_histogram: { buckets: [] } },
                    hits: { total: { value: 0 } },
                  }
                }
                thresholdEnum={_.get(triggerValues, `${fieldPath}num_results_condition`, '>=')}
                thresholdValue={_.get(triggerValues, `${fieldPath}num_results_value`, 1)}
                fieldPath={fieldPath}
                flyoutMode={flyoutMode}
                hideThresholdControls
                showModeSelector={false}
                errorMessage={graphErrorMessage || previewError}
                thresholdFieldName="num_results_value"
              />
            </EuiPanel>
          </div>

          <EuiSpacer size="m" />
          <Field name={`${fieldPath}throttle_enabled`}>
            {({ field, form }) => (
              <div style={widthStyle}>
                <EuiCheckbox
                  id={`${fieldPath}throttle_enabled`}
                  label="Throttle"
                  checked={!!field.value}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    form.setFieldValue(field.name, checked);
                    if (
                      checked &&
                      (_.get(form.values, `${fieldPath}suppress.value`) === undefined ||
                        _.get(form.values, `${fieldPath}suppress.value`) === null ||
                        _.get(form.values, `${fieldPath}suppress.value`) === '')
                    ) {
                      form.setFieldValue(`${fieldPath}suppress.value`, THROTTLE_DEFAULT.value);
                      form.setFieldValue(`${fieldPath}suppress.unit`, THROTTLE_DEFAULT.unit);
                    }
                    if (!checked) {
                      form.setFieldValue(`${fieldPath}suppress.value`, '');
                    }
                  }}
                />
              </div>
            )}
          </Field>

          {throttleEnabled && (
            <>
              <EuiSpacer size="s" />
              {this.renderThrottleFields(fieldPath)}
            </>
          )}

          <EuiSpacer size="m" />
          {this.renderExpiresFields(fieldPath)}

          <EuiSpacer size={'l'} />

          <FieldArray name={`${fieldPath}actions`} validateOnChange={true}>
            {(arrayHelpers) => (
              <ConfigureActionsPpl
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
                submitCount={submitCount}
                errors={errors}
                flyoutMode={flyoutMode}
              />
            )}
          </FieldArray>

          {!hasNotificationPlugin && (
            <>
              <EuiSpacer size="m" />
              <EuiCallOut title="The Notifications plugin is not installed" color="warning">
                <p>
                  Alerts still appear on the dashboard visualization when the trigger condition is
                  met.
                </p>
              </EuiCallOut>
            </>
          )}
        </div>
      </OuterAccordion>
    );
  }
}

export default DefineTriggerPpl;
