/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiSelect } from '@elastic/eui';

import FormikInputWrapper from '../FormikInputWrapper';
import FormikFormRow from '../FormikFormRow';

const FormikSelect = ({
  name,
  formRow = false,
  fieldProps = {},
  rowProps = {},
  inputProps = {},
  selectedOption = undefined,
}) => (
  <FormikInputWrapper
    name={name}
    fieldProps={fieldProps}
    render={({ field, form }) =>
      formRow ? (
        <FormikFormRow name={name} form={form} rowProps={rowProps}>
          <FieldSelect name={name} form={form} field={field} inputProps={inputProps} />
        </FormikFormRow>
      ) : (
        <FieldSelect
          name={name}
          form={form}
          field={field}
          inputProps={inputProps}
          selectedOption={selectedOption}
        />
      )
    }
  />
);

const FieldSelect = ({
  name,
  field,
  form,
  inputProps: { onChange, isInvalid, ...rest },
  selectedOption,
}) => (
  <EuiSelect
    name={name}
    id={name}
    {...rest}
    value={selectedOption ? selectedOption : field.value}
    onChange={(e) =>
      typeof onChange === 'function' ? onChange(e, field, form) : field.onChange(e)
    }
    isInvalid={typeof isInvalid === 'function' ? isInvalid(name, form) : isInvalid}
  />
);

FormikSelect.propTypes = {
  name: PropTypes.string.isRequired,
  formRow: PropTypes.bool,
  fieldProps: PropTypes.object,
  rowProps: PropTypes.object,
  inputProps: PropTypes.object,
};

FieldSelect.propTypes = {
  name: PropTypes.string.isRequired,
  form: PropTypes.object.isRequired,
  inputProps: PropTypes.object.isRequired,
  field: PropTypes.object.isRequired,
};

export default FormikSelect;
