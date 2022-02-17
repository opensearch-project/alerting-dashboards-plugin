/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import { Field } from 'formik';
import _ from 'lodash';
import { EuiFormRow, EuiFlexGroup, EuiFlexItem, EuiCheckbox } from '@elastic/eui';
import Daily from './Daily';

const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const checkboxFlexItem = (day, checked, setFieldValue, setFieldTouched) => (
  <EuiFlexItem key={day} grow={false} style={{ marginRight: '0px' }}>
    <EuiCheckbox
      id={day}
      label={_.startCase(day)}
      checked={checked}
      onChange={(e) => {
        setFieldValue(`weekly.${day}`, e.target.checked);
      }}
      onBlur={() => setFieldTouched('weekly')}
      compressed
    />
  </EuiFlexItem>
);

const validate = (value) => {
  const booleans = Object.values(value);
  if (!booleans.some((bool) => bool)) return 'Must select at least one weekday';
};

const Weekly = () => (
  <Fragment>
    <Field name="weekly" validate={validate}>
      {({ field: { value }, form: { touched, errors, setFieldValue, setFieldTouched } }) => (
        <EuiFormRow
          label="Run every"
          isInvalid={touched.weekly && !!errors.weekly}
          error={errors.weekly}
          style={{ marginTop: '5px' }}
        >
          <EuiFlexGroup alignItems="center">
            {days.map((day) => checkboxFlexItem(day, value[day], setFieldValue, setFieldTouched))}
          </EuiFlexGroup>
        </EuiFormRow>
      )}
    </Field>
    <Daily />
  </Fragment>
);

export default Weekly;
