/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonIcon,
} from '@elastic/eui';
import { ChainedAlertDetails } from './ChainedAlertDetails';

export const chainedAlertDetailsFlyout = ({ closeFlyout, alert, httpClient }) => {
  const [associatedAlerts, setAssociatedAlerts] = useState([]);

  useEffect(() => {
    httpClient.get('../api/alerting/workflows/alerts', { query: { workflowIds: alert.workflow_id, getAssociatedAlerts: true }})
    .then((response: any) => {
      if (response.ok) {
        setAssociatedAlerts(response.resp.associatedAlerts);
      }
    })
  }, []);

  return {
    flyoutProps: {
      'aria-labelledby': 'alertsDashboardFlyout',
      size: 'm',
      hideCloseButton: true,
    },
    headerProps: { hasBorder: true },
    header: (
      <EuiFlexGroup justifyContent="flexStart" alignItems="center">
        <EuiFlexItem className="eui-textTruncate">
          <EuiTitle
            className="eui-textTruncate"
            size={'m'}
          >
            <h3>{`Alert details`}</h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="cross"
            display="empty"
            iconSize="m"
            onClick={closeFlyout}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
    footerProps: { style: { backgroundColor: '#F5F7FA' } },
    body: (
      <ChainedAlertDetails alert={alert} associatedAlerts={associatedAlerts}/>
    ),
  }
}