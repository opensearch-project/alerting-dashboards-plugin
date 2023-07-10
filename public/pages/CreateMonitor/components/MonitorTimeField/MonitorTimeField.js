/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { hasError, isInvalid } from '../../../../utils/validate';
import { validateTimeField } from './utils/validation';
import { FormikComboBox } from '../../../../components/FormControls';

const MonitorTimeField = ({ dataTypes }) => {
  // Default empty option + options from index mappings mapped to ui select form
  const dateFields = Array.from(dataTypes.date || []);
  const options = [].concat(dateFields).map((option) => ({ label: option }));
  return (
    <FormikComboBox
      name="timeField"
      formRow
      fieldProps={{ validate: validateTimeField(dateFields) }}
      rowProps={{
        label: 'Time field',
        helpText: 'Choose the time field you want to use for your x-axis',
        isInvalid,
        error: hasError,
        style: { paddingLeft: '10px' },
      }}
      inputProps={{
        placeholder: 'Select a time field',
        options,
        onChange: (options, field, form) => {
          form.setFieldValue('timeField', options[0].label);
        },
        isClearable: false,
        singleSelection: { asPlainText: true },
        'data-test-subj': 'timeFieldComboBox',
      }}
    />
  );
};

export default MonitorTimeField;

MonitorTimeField.propTypes = {
  dataTypes: PropTypes.object.isRequired,
};
