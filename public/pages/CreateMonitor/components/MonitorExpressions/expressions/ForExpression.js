/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { EuiText, EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { UNITS_OF_TIME } from './utils/constants';
import { FormikFieldNumber, FormikSelect } from '../../../../../components/FormControls';
import { hasError, isInvalid, validatePositiveInteger } from '../../../../../utils/validate';
import IconToolTip from '../../../../../components/IconToolTip';
import { TIME_RANGE_TOOLTIP_TEXT } from '../../../containers/CreateMonitor/utils/constants';

class ForExpression extends Component {
  render() {
    return (
      <div>
        <EuiText size="xs">
          <strong>Time range for the last </strong>
          <IconToolTip content={TIME_RANGE_TOOLTIP_TEXT} iconType="questionInCircle" />
        </EuiText>
        <EuiSpacer size={'s'} />
        <EuiFlexGroup style={{ maxWidth: 600 }}>
          <EuiFlexItem grow={false} style={{ width: 150 }}>
            <FormikFieldNumber
              name="bucketValue"
              formRow
              fieldProps={{ validate: validatePositiveInteger }}
              inputProps={{ min: 1, onChange: this.onChangeWrapper }}
              rowProps={{
                isInvalid,
                error: hasError,
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ width: 150 }}>
            <FormikSelect
              name="bucketUnitOfTime"
              inputProps={{
                options: UNITS_OF_TIME,
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    );
  }
}

export default ForExpression;
