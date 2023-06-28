/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import {
  EuiConfirmModal,
  EuiOverlayMask
} from '@elastic/eui';

interface DeleteModalProps {
  monitors: any[];
  onClickDelete: () => void;
  closeDeleteModal: () => void;
}

export const DEFAULT_DELETION_TEXT = 'delete';

export default class DeleteMonitorModal extends Component<DeleteModalProps> {
  render() {
    const {
      monitors,
      closeDeleteModal,
      onClickDelete
    } = this.props;

    const monitorNames = monitors.map(monitor => monitor.name);
    let warningHeading = `Delete monitor ${monitorNames[0]}?`;
    let warningBody: React.ReactNode = 'This action cannot be undone.';
    let allowDelete = true;

    if (monitors.length === 1 && monitors[0].associatedCompositeMonitorCnt > 0) {
      warningHeading = `Unable to delete ${monitorNames[0]}`;
      warningBody = `The monitor ${monitorNames[0]} is currently associated with composite monitors. Unlink from the composite monitors before deleting this monitor.`;
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
          onCancel={allowDelete ? closeDeleteModal : () => {}}
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
}
