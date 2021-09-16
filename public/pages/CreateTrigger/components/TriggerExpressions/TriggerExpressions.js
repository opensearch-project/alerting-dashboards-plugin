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

import React, { Component } from 'react';
import { Field } from 'formik';
import { EuiFieldNumber, EuiFlexGroup, EuiFlexItem, EuiFormRow, EuiSelect } from '@elastic/eui';

export const Expressions = { THRESHOLD: 'THRESHOLD' };

const THRESHOLD_ENUM_OPTIONS = [
  { value: 'ABOVE', text: 'IS ABOVE' },
  { value: 'BELOW', text: 'IS BELOW' },
  { value: 'EXACTLY', text: 'IS EXACTLY' },
];

class TriggerExpressions extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { label, keyFieldName, valueFieldName } = this.props;

    return (
      <EuiFormRow label={label} style={{ width: '390px' }}>
        <EuiFlexGroup alignItems={'flexStart'} gutterSize={'m'}>
          <EuiFlexItem grow={1}>
            <Field name={keyFieldName}>
              {({ field: { onBlur, ...rest }, form: { touched, errors } }) => (
                <EuiFormRow
                  isInvalid={touched.thresholdEnum && !!errors.thresholdEnum}
                  error={errors.thresholdEnum}
                >
                  <EuiSelect options={THRESHOLD_ENUM_OPTIONS} {...rest} />
                </EuiFormRow>
              )}
            </Field>
          </EuiFlexItem>

          <EuiFlexItem grow={1}>
            <Field name={valueFieldName}>
              {({ field, form: { touched, errors } }) => (
                <EuiFormRow
                  isInvalid={touched.thresholdValue && !!errors.thresholdValue}
                  error={errors.thresholdValue}
                >
                  <EuiFieldNumber {...field} />
                </EuiFormRow>
              )}
            </Field>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFormRow>
    );
  }
}

export default TriggerExpressions;
