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

import React, { useState } from 'react';

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
  {
    values,
    onMadeChanges,
    arrayHelpers,
    options,
    closePopover,
    expressionWidth,
    aggregation,
    index,
  } = this.props
) {
  const [selectOption, setSelectOption] = useState(aggregation.aggregationType);

  const defaultOption = options[0]?.options[0];
  const [comboOption, setComboOption] = useState(
    aggregation.fieldName ? aggregation.fieldName : defaultOption.label
  );

  const onChangeWrapper = (e, field) => {
    onMadeChanges();
    setSelectOption(e.target.value);
  };

  const onChangeFieldWrapper = (options, field, form) => {
    onMadeChanges();
    setComboOption(options[0].label);
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
                name="aggregationType"
                selectedOption={selectOption}
                inputProps={{
                  onChange: onChangeWrapper,
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
                name="fieldName"
                selectedOption={{ label: comboOption }}
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
              arrayHelpers.replace(index, {
                aggregationType: selectOption,
                fieldName: comboOption,
              });
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
