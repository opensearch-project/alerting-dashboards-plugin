/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
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
