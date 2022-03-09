/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiLink, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

import FormikTextArea from '../../../../../components/FormControls/FormikTextArea/FormikTextArea';
import TimezoneComboBox from './TimezoneComboBox';
import { isInvalid, hasError } from '../../../../../utils/validate';
import { URL } from '../../../../../../utils/constants';

const cronHelpLink = (
  <EuiLink target="_blank" href={URL.DOCUMENTATION} external>
    cron expressions
  </EuiLink>
);

const cronHelpText = <EuiText size="s">Use {cronHelpLink} for complex schedules</EuiText>;

const CustomCron = () => (
  <EuiFlexGroup direction="column" style={{ marginTop: '5px' }}>
    <EuiFlexItem style={{ marginTop: '0px' }}>
      <FormikTextArea
        name="cronExpression"
        formRow
        rowProps={{
          label: 'Run every',
          helpText: cronHelpText,
          isInvalid,
          error: hasError,
          style: { marginTop: '0px' },
        }}
      />
    </EuiFlexItem>
    <EuiFlexItem style={{ marginTop: '0px' }}>
      <TimezoneComboBox />
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default CustomCron;
