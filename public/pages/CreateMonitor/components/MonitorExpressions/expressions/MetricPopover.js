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

import React from 'react';

import {
  EuiText,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
} from '@elastic/eui';

import { AGGREGATION_TYPES, EXPRESSION_STYLE, POPOVER_STYLE } from './utils/constants';
import { FormikComboBox, FormikSelect } from '../../../../../components/FormControls';

export default function MetricPopover(
  { options, closePopover, expressionWidth, index } = this.props
) {
  const onChangeFieldWrapper = (options, field, form) => {
    form.setFieldValue(`aggregations.${index}.fieldName`, options[0].label);
  };

  return (
    <div
      style={{
        width: Math.max(expressionWidth, 280) + 120,
        height: 160,
        ...POPOVER_STYLE,
        ...EXPRESSION_STYLE,
      }}
    >
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiFlexGroup direction="column" gutterSize="xs">
            <EuiFlexItem>
              <EuiText size="xs">
                <h4>Aggregation</h4>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <FormikSelect
                name={`aggregations.${index}.aggregationType`}
                inputProps={{
                  options: AGGREGATION_TYPES,
                  'data-test-subj': `metrics.${index}.aggregationTypeSelect`,
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiFlexGroup direction="column" gutterSize="xs">
            <EuiFlexItem>
              <EuiText size="xs">
                <h4>Field</h4>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <FormikComboBox
                name={`aggregations.${index}.fieldName`}
                inputProps={{
                  placeholder: 'Select a field',
                  options,
                  onChange: onChangeFieldWrapper,
                  isClearable: false,
                  singleSelection: { asPlainText: true },
                  'data-test-subj': `metrics.${index}.ofFieldComboBox`,
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      <EuiFlexGroup alignItems="center" justifyContent="flexEnd">
        <EuiFlexItem>
          <EuiButtonEmpty
            onClick={() => {
              closePopover();
            }}
          >
            Cancel
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiButton
            fill
            onClick={() => {
              closePopover();
            }}
          >
            Save
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
}
