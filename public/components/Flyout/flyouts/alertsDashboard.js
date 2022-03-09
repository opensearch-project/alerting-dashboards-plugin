/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButtonEmpty, EuiText } from '@elastic/eui';
import AlertsDashboardFlyoutComponent from './components/AlertsDashboardFlyoutComponent';

const alertsDashboard = (payload) => {
  const { closeFlyout, trigger_name } = payload;
  return {
    flyoutProps: {
      'aria-labelledby': 'alertsDashboardFlyout',
      size: 'm',
      hideCloseButton: true,
      'data-test-subj': `alertsDashboardFlyout_${trigger_name}`,
    },
    headerProps: { hasBorder: true },
    header: (
      <EuiText data-test-subj={`alertsDashboardFlyout_header_${trigger_name}`}>
        <h2>{`Alerts by ${trigger_name}`}</h2>
      </EuiText>
    ),
    footerProps: { style: { backgroundColor: '#F5F7FA' } },
    footer: (
      <EuiButtonEmpty
        iconType={'cross'}
        onClick={() => closeFlyout()}
        style={{ paddingLeft: '0px', marginLeft: '0px' }}
        data-test-subj={`alertsDashboardFlyout_closeButton_${trigger_name}`}
      >
        Close
      </EuiButtonEmpty>
    ),
    body: <AlertsDashboardFlyoutComponent {...payload} />,
  };
};

export default alertsDashboard;
