/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useEffect, useState } from 'react';
import {
  EuiConfirmModal,
  EuiLink,
  EuiOverlayMask
} from '@elastic/eui';
import { PLUGIN_NAME } from '../../../utils/constants';
import { createQueryObject } from '../../pages/utils/helpers';

interface DeleteModalProps {
  monitors: any[];
  httpClient?: any;
  onClickDelete: () => void;
  closeDeleteModal: () => void;
}

export const DEFAULT_DELETION_TEXT = 'delete';

export const DeleteMonitorModal = ({
    monitors,
    httpClient,
    closeDeleteModal,
    onClickDelete
  }: DeleteModalProps) => {
  const [associatedWorkflows, setAssociatedWorkflows] = useState<undefined | any[]>(undefined);
  const monitorNames = monitors.map(monitor => monitor.name);
  const [warningHeading, setWarningHeading] = useState<string>(`Delete monitor ${monitorNames[0]}?`);
  const [warningBody, setWarningBody] = useState<React.ReactNode>('This action cannot be undone.');
  const [allowDelete, setAllowDelete] = useState(true);

  useEffect(() => {
    if (monitors.length === 1 && monitors[0].associatedCompositeMonitorCnt > 0) {
      if (monitors[0].associated_workflows) {
        setAssociatedWorkflows(monitors[0].associated_workflows);
      }
      else {
        const dataSourceQuery = createQueryObject();
        httpClient?.get(`../api/alerting/monitors/${monitors[0].id}`, {...(dataSourceQuery ? { query: dataSourceQuery } : {})})
        .then((res: any) => {
          setAssociatedWorkflows(res.resp.associated_workflows);
        })
        .catch((err :any) => {
          console.error('err', err);
        });
      }
  
      setWarningHeading(`Unable to delete ${monitorNames[0]}`);
      setWarningBody(
        <>
          {`The monitor ${monitorNames[0]} is currently being used as a delegate monitor for composite monitors. Unlink from the following composite monitors before deleting this monitor:`}
          { associatedWorkflows ?
                <ul>
                  {associatedWorkflows.map(({ id, name }) => <li><EuiLink target='_blank' href={`${PLUGIN_NAME}#/monitors/${id}?type=workflow`}>{name}</EuiLink></li>)}
                </ul>
              : null
          }
        </>
      );
      setAllowDelete(false);
    }
    else if (monitorNames.length > 1) {
      setWarningHeading(`Delete ${monitorNames.length} monitors?`);
      setWarningBody(
        <>
          {`The following monitors will be permanently deleted. ${warningBody}`}
          <ul>
            {monitorNames.map((name, idx) => <li key={idx}>{name}</li>)}
          </ul>
        </>
      );
    }
  }, [associatedWorkflows]);

  return (
    <EuiOverlayMask>
      <EuiConfirmModal
        title={warningHeading}
        onCancel={closeDeleteModal}
        onConfirm={() => {
          if (allowDelete) {
            onClickDelete();
          }
          closeDeleteModal();
        }}
        cancelButtonText={allowDelete ? 'Cancel' : undefined}
        confirmButtonText={allowDelete ? 'Delete' : 'Close'}
        buttonColor={allowDelete ? 'danger' : 'primary'}
        defaultFocusedButton="confirm"
      >
        {warningBody}
      </EuiConfirmModal>
    </EuiOverlayMask>
  );
}
