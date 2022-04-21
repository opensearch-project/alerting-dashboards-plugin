/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormikSelect } from '../../../../../components/FormControls';
import { isInvalid, hasError } from '../../../../../utils/validate';

const frequencies = [
  { value: 'interval', text: 'By interval' },
  { value: 'daily', text: 'Daily' },
  { value: 'weekly', text: 'Weekly' },
  { value: 'monthly', text: 'Monthly' },
  { value: 'cronExpression', text: 'Custom cron expression' },
];

const Frequency = () => (
  <FormikSelect
    name="frequency"
    formRow
    rowProps={{
      label: 'Frequency',
      isInvalid,
      error: hasError,
    }}
    inputProps={{
      options: frequencies,
      isInvalid,
      'data-test-subj': 'frequency_field',
    }}
  />
);

export default Frequency;
