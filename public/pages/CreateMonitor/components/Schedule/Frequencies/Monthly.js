/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
