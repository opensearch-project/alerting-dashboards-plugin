import React from 'react';
import { EuiSpacer, EuiButton } from '@elastic/eui';
import MonitorExpressions from '../../../../pages/CreateMonitor/components/MonitorExpressions';
import DefineMonitor from '../../../../pages/CreateMonitor/containers/DefineMonitor/DefineMonitor';

export const Advanced = () => (
  <>
    <EuiSpacer />
    {/* <DefineMonitor
      values={values}
      errors={errors}
      touched={touched}
      httpClient={httpClient}
      location={location}
      detectorId={this.props.detectorId}
      notifications={notifications}
      isDarkMode={isDarkMode}
    /> */}
    <MonitorExpressions {...{ dataTypes: {}, errors: {} }} />
    <EuiSpacer size="s" />
  </>
);
