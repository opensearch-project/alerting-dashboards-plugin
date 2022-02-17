/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import moment from 'moment-timezone';
import { FormikComboBox } from '../../../../../components/FormControls';
import { hasError, isInvalid, validateTimezone } from '../../../../../utils/validate';

const timezones = moment.tz.names().map((tz) => ({ label: tz }));

const TimezoneComboBox = () => (
  <FormikComboBox
    name="timezone"
    formRow
    fieldProps={{ validate: validateTimezone }}
    rowProps={{
      isInvalid,
      error: hasError,
      style: { marginTop: '0px' },
    }}
    inputProps={{
      placeholder: 'Select a timezone',
      options: timezones,
      renderOption: ({ label: tz }) => `${tz} (${moment.tz(tz).format('Z')})`,
      onChange: (options, field, form) => {
        // EuiComboBox calls onBlur before onChange which causes the validation to happen before
        // the timezone field is set, so we do an extra validation here
        const error = validateTimezone(options);
        form.setFieldError('timezone', error);
        form.setFieldValue('timezone', options);
      },
      onBlur: (e, field, form) => {
        form.setFieldTouched('timezone', true);
      },
      singleSelection: { asPlainText: true },
      'data-test-subj': 'timezoneComboBox',
    }}
  />
);

export default TimezoneComboBox;
