/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
                  <EuiSelect
                    options={THRESHOLD_ENUM_OPTIONS}
                    data-test-subj={`${keyFieldName}_conditionEnumField`}
                    {...rest}
                  />
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
                  <EuiFieldNumber
                    data-test-subj={`${valueFieldName}_conditionValueField`}
                    {...field}
                  />
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
