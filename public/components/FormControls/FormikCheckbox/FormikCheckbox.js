/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiCheckbox } from '@elastic/eui';

import FormikInputWrapper from '../FormikInputWrapper';
import FormikFormRow from '../FormikFormRow';

const FormikCheckbox = ({
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
          <FieldCheckbox name={name} form={form} field={field} inputProps={inputProps} />
        </FormikFormRow>
      ) : (
        <FieldCheckbox name={name} field={field} inputProps={inputProps} />
      )
    }
  />
);

const FieldCheckbox = ({ name, field: { value, ...rest }, inputProps }) => (
  <EuiCheckbox name={name} id={name} checked={value} {...inputProps} {...rest} />
);

FormikCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
  formRow: PropTypes.bool,
  fieldProps: PropTypes.object,
  rowProps: PropTypes.object,
  inputProps: PropTypes.object,
};

FieldCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
  inputProps: PropTypes.object.isRequired,
  field: PropTypes.object.isRequired,
};

export default FormikCheckbox;
