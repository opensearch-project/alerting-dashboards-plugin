/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiCheckableCard } from '@elastic/eui';
import FormikInputWrapper from '../FormikInputWrapper';

const FormikCheckableCard = ({ name, fieldProps = {}, inputProps = {} }) => (
  <FormikInputWrapper
    name={name}
    fieldProps={fieldProps}
    render={({ field, form }) => (
      <FieldCheckableCard name={name} form={form} field={field} inputProps={inputProps} />
    )}
  />
);

const FieldCheckableCard = ({
  name,
  form,
  field,
  inputProps: { onChange, id, label, ...rest },
}) => (
  <EuiCheckableCard
    name={name}
    id={id}
    label={label}
    {...field}
    {...rest}
    onChange={(e) =>
      typeof onChange === 'function' ? onChange(e, field, form) : field.onChange(e)
    }
    className="eui-fullHeight"
  />
);

FormikCheckableCard.propTypes = {
  name: PropTypes.string.isRequired,
  fieldProps: PropTypes.object,
  inputProps: PropTypes.object,
};

FieldCheckableCard.propTypes = {
  name: PropTypes.string.isRequired,
  form: PropTypes.object.isRequired,
  inputProps: PropTypes.object.isRequired,
  field: PropTypes.object.isRequired,
};

export default FormikCheckableCard;
