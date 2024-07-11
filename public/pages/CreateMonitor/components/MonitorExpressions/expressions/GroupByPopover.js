/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import {
  EuiText,
  EuiSmallButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
} from '@elastic/eui';

import { EXPRESSION_STYLE, POPOVER_STYLE } from './utils/constants';
import { FormikComboBox } from '../../../../../components/FormControls';
import { hasError, isInvalid, requiredValidation } from '../../../../../utils/validate';

export default function GroupByPopover(
  { values, options, closePopover, expressionWidth, index, flyoutMode } = this.props
) {
  const validationString = 'Please select a field for the group by.';

  const disableOption = (label) => {
    options[0].options.forEach((element) => {
      if (element.label === label) {
        element.disabled = true;
      }
    });
  };

  values.groupBy.forEach((label) => {
    disableOption(label);
  });

  const onChangeFieldWrapper = (options, field, form) => {
    form.setFieldValue(`groupBy.${index}`, options[0].label);
  };

  return (
    <div
      style={{
        width: Math.max(expressionWidth, 250),
        height: flyoutMode ? 'auto' : 160,
        ...(flyoutMode ? {} : POPOVER_STYLE),
        ...(flyoutMode ? {} : EXPRESSION_STYLE),
      }}
    >
      <EuiFlexGroup direction="column" gutterSize="xs">
        <EuiFlexItem>
          <FormikComboBox
            name={`groupBy.${index}`}
            formRow
            fieldProps={{ validate: requiredValidation(validationString) }}
            rowProps={{
              label: 'Field',
              isInvalid,
            }}
            inputProps={{
              placeholder: 'Select a field',
              options,
              onChange: onChangeFieldWrapper,
              isClearable: false,
              singleSelection: { asPlainText: true },
              'data-test-subj': `groupBy.${index}.ofFieldComboBox`,
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      {!flyoutMode && (
        <>
          <EuiSpacer size="l" />
          <EuiFlexGroup alignItems="center" justifyContent="flexEnd">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={closePopover}>Cancel</EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSmallButton fill onClick={closePopover}>
                Save
              </EuiSmallButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      )}
    </div>
  );
}
