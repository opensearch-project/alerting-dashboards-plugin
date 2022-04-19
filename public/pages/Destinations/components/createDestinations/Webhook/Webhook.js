/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FormikFieldText } from '../../../../../components/FormControls';
import { hasError, isInvalid, required } from '../../../../../utils/validate';

//TODO:: verify the Regex for all the cases based on what backend support
const validateURL = (value) => {
  if (!value) return 'Required';
  const isValidUrl = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/.test(
    value
  );
  if (!isValidUrl) return 'Invalid URL';
};

const Webhook = ({ type }) => {
  return (
    <FormikFieldText
      name={`${type}.url`}
      formRow
      fieldProps={{ validate: validateURL }}
      rowProps={{
        label: 'Webhook URL:',
        style: { paddingLeft: '10px' },
        isInvalid,
        error: hasError,
      }}
      inputProps={{
        isInvalid,
        // 'validateURL()' is only called onBlur, but we enable the basic 'required()' validation onChange
        onChange: (e, field, form) => {
          field.onChange(e);
          form.setFieldError('name', required(e.target.value));
        },
        disabled: true,
      }}
    />
  );
};

Webhook.propTypes = {
  type: PropTypes.string.isRequired,
};

export default Webhook;
