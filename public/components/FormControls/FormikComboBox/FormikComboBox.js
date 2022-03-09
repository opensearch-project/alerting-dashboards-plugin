/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiComboBox } from '@elastic/eui';

import FormikInputWrapper from '../FormikInputWrapper';
import FormikFormRow from '../FormikFormRow';

const FormikComboBox = ({
  name,
  formRow = false,
  fieldProps = {},
  rowProps = {},
  inputProps = {},
}) => (
  <FormikInputWrapper
    name={name}
    fieldProps={fieldProps}
    render={({ field, form }) =>
      formRow ? (
        <FormikFormRow name={name} form={form} rowProps={rowProps}>
          <ComboBox name={name} form={form} field={field} inputProps={inputProps} />
        </FormikFormRow>
      ) : (
        <ComboBox name={name} form={form} field={field} inputProps={inputProps} />
      )
    }
  />
);

const ComboBox = ({
  name,
  form,
  field,
  inputProps: { onBlur, onChange, onCreateOption, ...rest },
}) => (
  <EuiComboBox
    name={name}
    id={name}
    onChange={
      typeof onChange === 'function'
        ? (options) => {
            onChange(options, field, form);
          }
        : onChange
    }
    onCreateOption={
      typeof onCreateOption === 'function'
        ? (value) => {
            onCreateOption(value, field, form);
          }
        : onCreateOption
    }
    onBlur={
      typeof onBlur === 'function'
        ? (e) => {
            onBlur(e, field, form);
          }
        : onBlur
    }
    selectedOptions={
      typeof field.value === 'string'
        ? field.value === ''
          ? undefined
          : [{ label: field.value }]
        : field.value
    }
    {...rest}
  />
);

FormikComboBox.propTypes = {
  name: PropTypes.string.isRequired,
  formRow: PropTypes.bool,
  fieldProps: PropTypes.object,
  rowProps: PropTypes.object,
  inputProps: PropTypes.object,
};

ComboBox.propTypes = {
  name: PropTypes.string.isRequired,
  inputProps: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
  field: PropTypes.object.isRequired,
};

export default FormikComboBox;
