/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React from 'react';
import { Field } from 'formik';
import _ from 'lodash';
import {
  EuiButton,
  EuiCodeEditor,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiLink,
  EuiText,
} from '@elastic/eui';
import 'brace/mode/json';
import 'brace/mode/plain_text';
import 'brace/snippets/javascript';
import 'brace/ext/language_tools';
import { formikToTrigger } from '../../containers/CreateTrigger/utils/formikToTrigger';
import { validateExtractionQuery } from '../../../../utils/validate';
import { TRIGGER_TYPE } from '../../containers/CreateTrigger/utils/constants';
import { MONITOR_TYPE } from '../../../../utils/constants';

export const getExecuteMessage = (response) => {
  if (!response) return 'No response';
  const triggerResults = _.get(response, 'trigger_results');
  if (!triggerResults) return 'No trigger results';
  const triggerId = Object.keys(triggerResults)[0];
  if (!triggerId) return 'No trigger results';
  const executeResults = _.get(triggerResults, `${triggerId}`);
  if (!executeResults) return 'No execute results';
  const { error } = executeResults;
  return error || getResultsBuckets(executeResults);
};

export const getResultsBuckets = (executeResults) => {
  const results = _.get(executeResults, 'agg_result_buckets', {});
  const resultsKeys = _.keys(results);
  if (_.isEmpty(resultsKeys)) return 'No execute results';
  const displayResults = resultsKeys.map((key) =>
    _.get(results, `${key}.agg_alert_content.bucket`, {})
  );
  return JSON.stringify(displayResults, null, 4);
};

const BucketLevelTriggerQuery = ({
  context,
  executeResponse,
  onRun,
  setFlyout,
  triggerValues,
  isDarkMode,
  fieldPath,
}) => {
  const currentTrigger = _.isEmpty(fieldPath)
    ? triggerValues
    : _.get(triggerValues, `${fieldPath.slice(0, -1)}`, {});
  const trigger = formikToTrigger(currentTrigger, { monitor_type: MONITOR_TYPE.BUCKET_LEVEL });
  _.set(trigger, `${TRIGGER_TYPE.BUCKET_LEVEL}.actions`, []);
  const fieldName = `${fieldPath}bucketSelector`;
  return (
    <div>
      <EuiFlexGroup direction={'column'} style={{ paddingLeft: '20px', paddingRight: '20px' }}>
        <EuiFlexItem style={{ marginBottom: '20px' }}>
          <EuiFlexGroup alignItems={'stretch'} gutterSize={'m'}>
            <EuiFlexItem grow={1}>
              <Field name={fieldName} validate={validateExtractionQuery}>
                {({
                  field: { value },
                  form: { errors, touched, setFieldValue, setFieldTouched },
                }) => (
                  <EuiFormRow
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
                      mode="json"
                      theme={isDarkMode ? 'sense-dark' : 'github'}
                      height="200px"
                      width="100%"
                      onChange={(source) => {
                        setFieldValue(fieldName, source);
                      }}
                      onBlur={() => setFieldTouched(fieldName, true)}
                      value={value}
                    />
                  </EuiFormRow>
                )}
              </Field>
            </EuiFlexItem>

            <EuiFlexItem grow={1} style={{ paddingTop: '6px' }}>
              <EuiFormRow
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
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiButton
        onClick={() => onRun(_.isArray(trigger) ? trigger : [trigger])}
        size={'s'}
        style={{ marginLeft: '10px' }}
      >
        Preview condition response
      </EuiButton>
    </div>
  );
};

export default BucketLevelTriggerQuery;
