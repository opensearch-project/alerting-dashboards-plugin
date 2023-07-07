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
  let warningHeading = `Delete monitor ${monitorNames[0]}?`;
  let warningBody: React.ReactNode = 'This action cannot be undone.';
  let allowDelete = true;

  if (monitors.length === 1 && monitors[0].associatedCompositeMonitorCnt > 0) {
    if (monitors[0].associated_workflows) {
      setAssociatedWorkflows(monitors[0].associated_workflows);
    }
    else {
      httpClient?.get(`../api/alerting/monitors/${monitors[0].id}`)
      .then((res: any) => {
        setAssociatedWorkflows(res.resp.associated_workflows);
      })
      .catch((err :any) => {
        console.error('err', err);
      });
    }

    warningHeading = `Unable to delete ${monitorNames[0]}`;
    warningBody = (
      <>
        {`The monitor ${monitorNames[0]} is currently associated with composite monitors. Unlink from the composite monitors before deleting this monitor.`}
        { associatedWorkflows ?
              <ul>
                {associatedWorkflows.map(({ id, name }) => <li><EuiLink target='_blank' href={`${PLUGIN_NAME}#/monitors/${id}?type=workflow`}>{name}</EuiLink></li>)}
              </ul>
            : null
        }
      </>
    )
    allowDelete = false;
  }
  else if (monitorNames.length > 1) {
    warningHeading = `Delete ${monitorNames.length} monitors?`;
    warningBody = (
      <>
        {`The following monitors will be permanently deleted. ${warningBody}`}
        <ul>
          {monitorNames.map((name, idx) => <li key={idx}>{name}</li>)}
        </ul>
      </>
    )
  }

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
