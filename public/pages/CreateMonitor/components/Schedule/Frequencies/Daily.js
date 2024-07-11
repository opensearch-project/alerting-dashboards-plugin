/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Field } from 'formik';
import moment from 'moment';
import { EuiCompressedFormRow, EuiDatePicker, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import TimezoneComboBox from './TimezoneComboBox';

const Daily = () => (
  <EuiFlexGroup direction="column" style={{ marginTop: '5px' }}>
    <EuiFlexItem style={{ marginTop: '0px' }}>
      <Field name="daily">
        {({
          field: { value, onChange, onBlur, ...rest },
          form: { touched, errors, setFieldValue },
        }) => (
          <EuiCompressedFormRow label="Around" style={{ marginTop: '0px' }}>
            <EuiDatePicker
              showTimeSelect
              showTimeSelectOnly
              selected={moment().hours(value).minutes(0)}
              onChange={(date) => {
                setFieldValue('daily', date.hours());
              }}
              dateFormat="hh:mm A"
              timeIntervals={60}
              {...rest}
            />
          </EuiCompressedFormRow>
        )}
      </Field>
    </EuiFlexItem>
    <EuiFlexItem style={{ marginTop: '0px' }}>
      <TimezoneComboBox />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default Daily;
