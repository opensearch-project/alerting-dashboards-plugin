/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import { EuiSpacer, EuiText } from '@elastic/eui';
import MonitorsList from './components/MonitorsList';

const AssociateMonitors = ({ monitors, options }) => {
  const onUpdate = () => {};

  return (
    <Fragment>
      <EuiText size={'m'} style={{ paddingBottom: '0px', marginBottom: '0px' }}>
        <h4>Associate monitors</h4>
      </EuiText>
      <EuiText color={'subdued'} size={'xs'}>
        Associate two or more monitors to run as part of this flow.
      </EuiText>

      <EuiSpacer size="m" />

      <MonitorsList monitors={monitors} options={options} />
    </Fragment>
  );
};

export default AssociateMonitors;
