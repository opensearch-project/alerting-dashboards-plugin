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
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
} from '@elastic/eui';
import { ChainedAlertDetails } from './ChainedAlertDetails';
import { getDataSourceQueryObj } from '../../../utils/helpers';

export const ChainedAlertDetailsFlyout = ({ closeFlyout, alert, httpClient }) => {
  const [associatedAlerts, setAssociatedAlerts] = useState([]);

  useEffect(() => {
    const dataSourceQuery = getDataSourceQueryObj();
    httpClient.get('../api/alerting/workflows/alerts', { 
      query: { 
        workflowIds: alert.workflow_id,
        getAssociatedAlerts: true,
        sortString: 'start_time',
        sortOrder: 'desc',
        startIndex: 0,
        size: 1000,
        alertIds: alert.id,
        severityLevel: 'ALL',
        alertState: 'ALL',
        searchString: '',
        dataSourceId: dataSourceQuery?.query?.dataSourceId,
      }
    })
    .then((response: any) => {
      if (response.ok) {
        const associatedAlertIds = new Set(alert.associated_alert_ids);
        const associatedAlerts = response.resp.associatedAlerts.filter(a => associatedAlertIds.has(a.id));
        setAssociatedAlerts(associatedAlerts);
      }
    })
  }, []);

  return (
    <EuiFlyout
      onClose={closeFlyout}
      ownFocus={true}
      hideCloseButton={true}
      side={'right'}
      size={'m'}
    >
      <EuiFlyoutHeader>
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
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <ChainedAlertDetails alert={alert} associatedAlerts={associatedAlerts}/>
      </EuiFlyoutBody>
    </EuiFlyout>
  )
}