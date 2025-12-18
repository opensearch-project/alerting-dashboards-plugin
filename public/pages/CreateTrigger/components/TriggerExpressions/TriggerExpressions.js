/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { Field } from 'formik';
import {
  EuiCompressedFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiCompressedSelect,
} from '@elastic/eui';

export const Expressions = { THRESHOLD: 'THRESHOLD' };

// Canonical operator options: show friendly text to the user, store the symbol in Formik
const NUMBER_OF_RESULTS_OPERATOR_OPTIONS = [
  { value: '>', text: 'Greater than' },
  { value: '>=', text: 'Greater than or equal to' },
  { value: '<', text: 'Less than' },
  { value: '<=', text: 'Less than or equal to' },
  { value: '==', text: 'Equal to' },
  { value: '!=', text: 'Not equal to' },
];

// Normalize legacy/worded values so the select always has a valid symbol
const normalizeToSymbol = (raw) => {
  const v = String(raw ?? '').trim().toLowerCase();
  switch (v) {
    case 'above':
    case 'greater than':
    case '>':
      return '>';
    case 'at least':
    case 'greater than or equal to':
    case '>=':
      return '>=';
    case 'below':
    case 'less than':
    case '<':
      return '<';
    case 'at most':
    case 'less than or equal to':
    case '<=':
      return '<=';
    case 'equal':
    case 'equals':
    case '==':
      return '==';
    case 'not equal':
    case '!=':
      return '!=';
    default:
      return '>='; // safe default
  }
};

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
        <EuiFlexGroup alignItems="flexStart" gutterSize="m">
          <EuiFlexItem grow={1}>
            <Field name={keyFieldName}>
              {({ field, form, meta }) => {
                const safeValue = normalizeToSymbol(field.value);
                if (safeValue !== field.value) {
                  // Coerce once without triggering validation churn
                  form.setFieldValue(field.name, safeValue, false);
                }
                return (
                  <EuiCompressedFormRow
                    isInvalid={!!(meta.touched && meta.error)}
                    error={meta.error}
                  >
                    <EuiCompressedSelect
                      name={field.name}
                      value={safeValue}
                      options={NUMBER_OF_RESULTS_OPERATOR_OPTIONS}
                      onChange={(e) => form.setFieldValue(field.name, e.target.value)}
                      onBlur={field.onBlur}
                      data-test-subj={`${keyFieldName}_conditionEnumField`}
                    />
                  </EuiCompressedFormRow>
                );
              }}
            </Field>
          </EuiFlexItem>

          <EuiFlexItem grow={1}>
            <Field name={valueFieldName}>
              {({ field, meta }) => (
                <EuiCompressedFormRow
                  isInvalid={!!(meta.touched && meta.error)}
                  error={meta.error}
                >
                  <EuiCompressedFieldNumber
                    {...field}
                    min={0}
                    step={1}
                    data-test-subj={`${valueFieldName}_conditionValueField`}
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
