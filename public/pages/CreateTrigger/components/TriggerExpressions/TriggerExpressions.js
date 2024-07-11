/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { Field } from 'formik';
import {
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiSelect,
} from '@elastic/eui';
import { THRESHOLD_ENUM_OPTIONS } from '../../utils/constants';

export const Expressions = { THRESHOLD: 'THRESHOLD' };

class TriggerExpressions extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { label, keyFieldName, valueFieldName, flyoutMode } = this.props;
    return (
      <EuiCompressedFormRow
        label={label}
        style={flyoutMode ? { maxWidth: '100%' } : { width: '390px' }}
      >
        <EuiFlexGroup alignItems={'flexStart'} gutterSize={'m'}>
          <EuiFlexItem grow={1}>
            <Field name={keyFieldName}>
              {({ field: { onBlur, ...rest }, form: { touched, errors } }) => (
                <EuiCompressedFormRow
                  isInvalid={touched.thresholdEnum && !!errors.thresholdEnum}
                  error={errors.thresholdEnum}
                >
                  <EuiSelect
                    options={THRESHOLD_ENUM_OPTIONS}
                    data-test-subj={`${keyFieldName}_conditionEnumField`}
                    {...rest}
                  />
                </EuiCompressedFormRow>
              )}
            </Field>
          </EuiFlexItem>

          <EuiFlexItem grow={1}>
            <Field name={valueFieldName}>
              {({ field, form: { touched, errors } }) => (
                <EuiCompressedFormRow
                  isInvalid={touched.thresholdValue && !!errors.thresholdValue}
                  error={errors.thresholdValue}
                >
                  <EuiFieldNumber
                    data-test-subj={`${valueFieldName}_conditionValueField`}
                    {...field}
                  />
                </EuiCompressedFormRow>
              )}
            </Field>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiCompressedFormRow>
    );
  }
}

export default TriggerExpressions;
