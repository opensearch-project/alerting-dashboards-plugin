/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiFormRow } from '@elastic/eui';

const FormikFormRow = ({ children, form, name, rowProps: { isInvalid, error, ...rest } }) => (
  <EuiFormRow
    id={`${name}-form-row`}
    isInvalid={typeof isInvalid === 'function' ? isInvalid(name, form) : isInvalid}
    error={typeof error === 'function' ? error(name, form) : error}
    {...rest}
  >
    {children}
  </EuiFormRow>
);

FormikFormRow.propTypes = {
  name: PropTypes.string.isRequired,
  rowProps: PropTypes.object.isRequired,
  form: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
};

export default FormikFormRow;
