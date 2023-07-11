/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

import { FormikFieldNumber, FormikSelect } from '../../../../../components/FormControls';
import {
  isInvalid,
  hasError,
  validatePositiveInteger,
  validateUnit,
} from '../../../../../utils/validate';

export const unitOptions = [
  { value: 'MINUTES', text: 'Minute(s)' },
  { value: 'HOURS', text: 'Hours' },
  { value: 'DAYS', text: 'Days' },
];

export const unitToLabel = unitOptions.reduce(
  (acc, cur) => ({
    ...acc,
    [cur.value]: cur.text,
  }),
  {}
);

const Interval = () => (
  <EuiFlexGroup alignItems="flexStart" gutterSize="m">
    <EuiFlexItem>
      <FormikFieldNumber
        name="period.interval"
        formRow
        fieldProps={{ validate: validatePositiveInteger }}
        rowProps={{
          label: 'Run every',
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          icon: 'clock',
          min: 1,
          'data-test-subj': 'interval_interval_field',
        }}
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <FormikSelect
        name="period.unit"
        formRow
        fieldProps={{ validate: validateUnit }}
        rowProps={{
          hasEmptyLabelSpace: true,
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          options: unitOptions,
          'data-test-subj': 'interval_unit_field',
        }}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default Interval;
