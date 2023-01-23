import React from 'react';
import { EuiSpacer } from '@elastic/eui';
import MonitorExpressions from '../../../../pages/CreateMonitor/components/MonitorExpressions';

export const Advanced = () => (
  <>
    <EuiSpacer />
    <MonitorExpressions {...{ dataTypes: {}, errors: {} }} />
    <EuiSpacer size="s" />
  </>
);
