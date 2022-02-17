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

const unitOptions = [
  { value: 'MINUTES', text: 'Minutes' },
  { value: 'HOURS', text: 'Hours' },
  { value: 'DAYS', text: 'Days' },
];

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
        inputProps={{ icon: 'clock', min: 1 }}
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
        inputProps={{ options: unitOptions }}
      />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default Interval;
