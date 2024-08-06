/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Field } from 'formik';
import _ from 'lodash';
import {
  EuiButton,
  EuiCodeEditor,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiLink,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import 'brace/mode/json';
import 'brace/mode/plain_text';
import 'brace/snippets/javascript';
import 'brace/ext/language_tools';
import { formikToTrigger } from '../../containers/CreateTrigger/utils/formikToTrigger';

export const getExecuteMessage = (response) => {
  if (!response) return 'No response';
  const triggerResults = _.get(response, 'trigger_results');
  if (!triggerResults) return 'No trigger results';
  const triggerId = Object.keys(triggerResults)[0];
  if (!triggerId) return 'No trigger results';
  const executeResults = _.get(triggerResults, triggerId);
  if (!executeResults) return 'No execute results';
  const { error, triggered, triggeredDocs } = executeResults;
  if (!_.isNull(error) && !_.isUndefined(error)) return error;
  if (!_.isNull(triggered) && !_.isUndefined(triggered)) return `${triggered}`;
  if (!_.isNull(triggeredDocs) && !_.isUndefined(triggeredDocs))
    return JSON.stringify(triggeredDocs, null, 4);
};

const TriggerQuery = ({
  context,
  error,
  executeResponse,
  onRun,
  response,
  triggerValues,
  setFlyout,
  isDarkMode,
  fieldPath,
  isAd = false,
}) => {
  const currentTrigger = _.isEmpty(fieldPath)
    ? triggerValues
    : _.get(triggerValues, `${fieldPath.slice(0, -1)}`, {});
  const trigger = { ...formikToTrigger(currentTrigger), actions: [] };
  const responseToFormat = _.isEmpty(response) && isAd ? onRun([trigger]) : response;
  const formattedResponse = JSON.stringify(responseToFormat, null, 4);
  const fieldName = `${fieldPath}script.source`;

  return (
    <div>
      <EuiFlexGroup direction={'column'}>
        <EuiFlexItem style={{ paddingLeft: '10px', paddingRight: '10px' }}>
          <EuiFlexGroup alignItems={'stretch'} gutterSize={'m'}>
            <EuiFlexItem grow={1} style={{ marginBottom: '20px' }}>
              <div>
                {isAd ? (
                  <div>
                    <EuiSpacer size={'s'} />
                    <EuiCompressedFormRow label="Response" fullWidth={true}>
                      <EuiCodeEditor
                        grow={true}
                        mode="json"
                        theme={isDarkMode ? 'sense-dark' : 'github'}
                        height="200px"
                        width="100%"
                        value={error || formattedResponse}
                        readOnly
                      />
                    </EuiCompressedFormRow>
                    <EuiSpacer size={'l'} />
                  </div>
                ) : null}

                <Field name={fieldName}>
                  {({
                    field: { value },
                    form: { errors, touched, setFieldValue, setFieldTouched },
                  }) => (
                    <EuiCompressedFormRow
                      label={
                        <EuiFlexGroup alignItems={'flexEnd'} gutterSize={'s'}>
                          <EuiFlexItem grow={false}>
                            <EuiText size={'xs'}>
                              <strong>Trigger condition</strong>
                            </EuiText>
                          </EuiFlexItem>
                          <EuiFlexItem>
                            <EuiText>
                              <EuiLink
                                onClick={() => {
                                  setFlyout({ type: 'triggerCondition', payload: context });
                                }}
                              >
                                Info
                              </EuiLink>
                            </EuiText>
                          </EuiFlexItem>
                        </EuiFlexGroup>
                      }
                      fullWidth={true}
                      isInvalid={_.get(touched, fieldName, false) && !!_.get(errors, fieldName)}
                      error={_.get(errors, fieldName)}
                    >
                      <EuiCodeEditor
                        grow={true}
                        mode="plain_text"
                        theme={isDarkMode ? 'sense-dark' : 'github'}
                        height="200px"
                        width="100%"
                        onChange={(source) => {
                          setFieldValue(fieldName, source);
                        }}
                        onBlur={() => setFieldTouched(fieldName, true)}
                        value={value}
                        data-test-subj={'triggerQueryCodeEditor'}
                      />
                    </EuiCompressedFormRow>
                  )}
                </Field>
              </div>
            </EuiFlexItem>

            <EuiFlexItem grow={1} style={{ marginBottom: '0px', paddingTop: '6px' }}>
              <EuiCompressedFormRow
                fullWidth={true}
                label={
                  <EuiText size={'xs'}>
                    <strong>Trigger condition response</strong>
                  </EuiText>
                }
              >
                <EuiCodeEditor
                  grow={true}
                  mode="plain_text"
                  theme={isDarkMode ? 'sense-dark' : 'github'}
                  height="200px"
                  width="100%"
                  value={getExecuteMessage(executeResponse)}
                  readOnly
                />
              </EuiCompressedFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiButton onClick={() => onRun([trigger])} size={'s'} style={{ marginLeft: '10px' }}>
        Preview condition response
      </EuiButton>
    </div>
  );
};

export default TriggerQuery;
