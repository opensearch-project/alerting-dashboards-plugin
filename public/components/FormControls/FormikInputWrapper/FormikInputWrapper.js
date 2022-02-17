/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Field } from 'formik';

const FormikInputWrapper = ({ name, fieldProps, render }) => (
  <Field name={name} {...fieldProps}>
    {({ field, form }) => render({ field, form })}
  </Field>
);

FormikInputWrapper.propTypes = {
  name: PropTypes.string.isRequired,
  fieldProps: PropTypes.object.isRequired,
  render: PropTypes.func.isRequired,
};

export default FormikInputWrapper;
