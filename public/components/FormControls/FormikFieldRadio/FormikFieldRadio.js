/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiRadio } from '@elastic/eui';

import FormikInputWrapper from '../FormikInputWrapper';
import FormikFormRow from '../FormikFormRow';

const FormikFieldRadio = ({
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
          <FieldRadio name={name} form={form} field={field} inputProps={inputProps} />
        </FormikFormRow>
      ) : (
        <FieldRadio name={name} form={form} field={field} inputProps={inputProps} />
      )
    }
  />
);

const FieldRadio = ({ name, form, field, inputProps: { onChange, ...rest } }) => (
  <EuiRadio
    {...field}
    {...rest}
    onChange={(e) =>
      typeof onChange === 'function' ? onChange(e, field, form) : field.onChange(e)
    }
  />
);

FormikFieldRadio.propTypes = {
  name: PropTypes.string.isRequired,
  formRow: PropTypes.bool,
  fieldProps: PropTypes.object,
  rowProps: PropTypes.object,
  inputProps: PropTypes.object,
};

FieldRadio.propTypes = {
  name: PropTypes.string.isRequired,
  inputProps: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
  field: PropTypes.object.isRequired,
};

export default FormikFieldRadio;
