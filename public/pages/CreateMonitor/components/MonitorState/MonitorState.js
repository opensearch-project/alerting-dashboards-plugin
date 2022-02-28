/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import { EuiSpacer } from '@elastic/eui';

import SubHeader from '../../../../components/SubHeader';
import { FormikCheckbox } from '../../../../components/FormControls';

const MonitorState = () => (
  <Fragment>
    <SubHeader
      title={<h4>Monitor state</h4>}
      description={<span>Disabled monitors do not run.</span>}
    />
    <EuiSpacer size="s" />
    <FormikCheckbox
      name="disabled"
      formRow
      rowProps={{ style: { paddingLeft: '10px' } }}
      inputProps={{ label: 'Disable monitor' }}
    />
  </Fragment>
);

export default MonitorState;
