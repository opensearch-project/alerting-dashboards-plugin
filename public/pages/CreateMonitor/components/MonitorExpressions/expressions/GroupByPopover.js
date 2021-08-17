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

import { EXPRESSION_STYLE, POPOVER_STYLE } from './utils/constants';
import { FormikComboBox } from '../../../../../components/FormControls';

export default function GroupByPopover(
  {
    values,
    onMadeChanges,
    arrayHelpers,
    options,
    closePopover,
    expressionWidth,
    index,
    groupByItem,
  } = this.props
) {
  const defaultOption = options[0]?.options[0];
  const [comboOption, setComboOption] = useState(groupByItem ? groupByItem : defaultOption.label);

  const onChangeFieldWrapper = (options, field, form) => {
    onMadeChanges();
    // form.setFieldValue('groupByField', options);
    form.setFieldError('groupBy', undefined);
    setComboOption(options[0].label);
  };

  // console.log(`groupBy groupByField ${JSON.stringify(values.groupBy)}, ${JSON.stringify(values.groupByField)}`)

  return (
    <div
      style={{
        width: Math.max(expressionWidth, 250),
        height: 160,
        ...POPOVER_STYLE,
        ...EXPRESSION_STYLE,
      }}
    >
      <EuiFlexGroup direction="column" gutterSize="xs">
        <EuiFlexItem>
          <EuiText size="xs">
            <h4>Field</h4>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <FormikComboBox
            name="groupByField"
            selectedOption={{ label: comboOption }}
            inputProps={{
              placeholder: 'Select a field',
              options,
              onChange: onChangeFieldWrapper,
              isClearable: false,
              singleSelection: { asPlainText: true },
              'data-test-subj': 'ofFieldComboBox',
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      <EuiFlexGroup alignItems="center" justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            onClick={() => {
              closePopover();
            }}
          >
            Cancel
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            onClick={() => {
              arrayHelpers.replace(index, comboOption);
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
