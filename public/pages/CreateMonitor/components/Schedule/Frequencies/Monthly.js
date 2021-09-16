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

import React, { Fragment } from 'react';
import { EuiFlexItem, EuiFlexGroup, EuiSpacer } from '@elastic/eui';
import Daily from './Daily';
import { FormikFieldNumber, FormikSelect } from '../../../../../components/FormControls';
import { isInvalid, hasError, validateMonthlyDay } from '../../../../../utils/validate';
import { monthlyTypes } from './utils/constants';

const Monthly = () => (
  <Fragment>
    <EuiFlexGroup alignItems="flexStart">
      <EuiFlexItem>
        <FormikSelect
          name="monthly.type"
          formRow
          rowProps={{
            label: 'On the',
            isInvalid,
            error: hasError,
          }}
          inputProps={{
            options: monthlyTypes,
            onChange: (e, field, form) => {
              form.setFieldValue('monthly.type', e.target.value);
            },
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <FormikFieldNumber
          name="monthly.day"
          formRow
          fieldProps={{ validate: validateMonthlyDay }}
          rowProps={{
            hasEmptyLabelSpace: true,
            isInvalid,
            error: hasError,
          }}
          inputProps={{ min: 1, max: 31 }}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size="xs" />
    <Daily />
  </Fragment>
);

export default Monthly;
