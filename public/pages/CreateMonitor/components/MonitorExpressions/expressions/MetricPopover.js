/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import {
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
} from '@elastic/eui';

import { AGGREGATION_TYPES, EXPRESSION_STYLE, POPOVER_STYLE } from './utils/constants';
import { FormikComboBox, FormikSelect } from '../../../../../components/FormControls';
import { hasError, isInvalid, requiredValidation } from '../../../../../utils/validate';

export default function MetricPopover(
  { options, closePopover, expressionWidth, index, flyoutMode } = this.props
) {
  const validationString = 'Please select a field for the metric aggregation.';

  const onChangeAggWrapper = (e, field, form) => {
    form.setFieldValue(`aggregations.${index}.aggregationType`, e.target.value);
  };
  const onChangeFieldWrapper = async (options, field, form) => {
    form.setFieldValue(`aggregations.${index}.fieldName`, options[0].label);
  };

  return (
    <div
      style={{
        width: Math.max(expressionWidth, 280) + 120,
        height: flyoutMode ? 'auto' : 160,
        ...(flyoutMode ? {} : POPOVER_STYLE),
        ...(flyoutMode ? {} : EXPRESSION_STYLE),
      }}
    >
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={flyoutMode ? true : false}>
          <EuiFlexGroup direction="column" gutterSize="xs">
            <EuiFlexItem>
              <FormikSelect
                name={`aggregations.${index}.aggregationType`}
                inputProps={{
                  options: AGGREGATION_TYPES,
                  onChange: onChangeAggWrapper,
                  'data-test-subj': `metrics.${index}.aggregationTypeSelect`,
                }}
                formRow
                rowProps={{
                  label: 'Aggregation',
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiFlexGroup direction="column" gutterSize="xs">
            <EuiFlexItem>
              <FormikComboBox
                name={`aggregations.${index}.fieldName`}
                formRow
                fieldProps={{ validate: requiredValidation(validationString) }}
                rowProps={{
                  label: 'Field',
                  isInvalid,
                  error: hasError,
                }}
                inputProps={{
                  placeholder: 'Select a field',
                  options,
                  onChange: onChangeFieldWrapper,
                  onBlur: (e, field, form) => {
                    form.setFieldTouched(`aggregations.${index}.fieldName`, true);
                  },
                  isClearable: false,
                  singleSelection: { asPlainText: true },
                  'data-test-subj': `metrics.${index}.ofFieldComboBox`,
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      {!flyoutMode && (
        <>
          <EuiSpacer size="l" />

          <EuiFlexGroup alignItems="center" justifyContent="flexEnd">
            <EuiFlexItem>
              <EuiSmallButtonEmpty
                onClick={() => {
                  closePopover();
                }}
              >
                Cancel
              </EuiSmallButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiSmallButton
                fill
                onClick={() => {
                  closePopover();
                }}
              >
                Save
              </EuiSmallButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </div>
  );
}
