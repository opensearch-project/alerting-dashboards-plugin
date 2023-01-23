import React from 'react';
import { EuiSpacer, EuiButton } from '@elastic/eui';
import MonitorExpressions from '../../../../pages/CreateMonitor/components/MonitorExpressions';

export const Advanced = () => (
  <>
    <EuiSpacer />
    <MonitorExpressions {...{ dataTypes: {}, errors: {} }} />
    <EuiSpacer size="s" />
    <EuiButton onClick={() => {}} fullWidth size="s">
      Preview query and performance
    </EuiButton>
  </>
);
