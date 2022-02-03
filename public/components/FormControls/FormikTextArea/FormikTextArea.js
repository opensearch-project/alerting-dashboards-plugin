/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiTextArea } from '@elastic/eui';
import FormikInputWrapper from '../FormikInputWrapper';
import FormikFormRow from '../FormikFormRow';

const FormikTextArea = ({
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
          <TextArea name={name} form={form} field={field} inputProps={inputProps} />
        </FormikFormRow>
      ) : (
        <TextArea name={name} form={form} field={field} inputProps={inputProps} />
      )
    }
  />
);

const TextArea = ({ name, form, field, inputProps: { isInvalid, ...rest } }) => (
  <EuiTextArea
    isInvalid={typeof isInvalid === 'function' ? isInvalid(name, form) : isInvalid}
    {...field}
    {...rest}
  />
);

FormikTextArea.propTypes = {
  name: PropTypes.string.isRequired,
  formRow: PropTypes.bool,
  fieldProps: PropTypes.object,
  rowProps: PropTypes.object,
  inputProps: PropTypes.object,
};

TextArea.propTypes = {
  name: PropTypes.string.isRequired,
  inputProps: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
  field: PropTypes.object.isRequired,
};

export default FormikTextArea;
