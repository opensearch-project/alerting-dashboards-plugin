/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiCodeEditor } from '@elastic/eui';

import FormikInputWrapper from '../FormikInputWrapper';
import FormikFormRow from '../FormikFormRow';

const FormikCodeEditor = ({
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
          <CodeEditor name={name} form={form} field={field} inputProps={inputProps} />
        </FormikFormRow>
      ) : (
        <CodeEditor name={name} form={form} field={field} inputProps={inputProps} />
      )
    }
  />
);

const CodeEditor = ({ name, form, field, inputProps: { onBlur, onChange, ...rest } }) => (
  <EuiCodeEditor
    id={name}
    onChange={(string) => {
      onChange(string, field, form);
    }}
    onBlur={(e) => {
      onBlur(e, field, form);
    }}
    value={field.value}
    {...rest}
  />
);

FormikCodeEditor.propTypes = {
  name: PropTypes.string.isRequired,
  formRow: PropTypes.bool,
  fieldProps: PropTypes.object,
  rowProps: PropTypes.object,
  inputProps: PropTypes.object,
};

CodeEditor.propTypes = {
  name: PropTypes.string.isRequired,
  inputProps: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
  field: PropTypes.object.isRequired,
};

export default FormikCodeEditor;
