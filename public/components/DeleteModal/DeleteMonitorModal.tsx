/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ChangeEvent, Component } from 'react';
import {
  EuiConfirmModal,
  EuiOverlayMask
} from '@elastic/eui';

interface DeleteModalProps {
  monitorNames: string[];
  onClickDelete: (event?: any) => void;
  closeDeleteModal: (event?: any) => void;
}

export const DEFAULT_DELETION_TEXT = 'delete';

export default class DeleteMonitorModal extends Component<DeleteModalProps> {
  render() {
    const {
      monitorNames,
      closeDeleteModal,
      onClickDelete
    } = this.props;

    let warningHeading = `Delete monitor ${monitorNames[0]}?`;
    let warningBody: React.ReactNode = 'This action cannot be undone.';

    if (monitorNames.length > 1) {
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
            onClickDelete();
            closeDeleteModal();
          }}
          cancelButtonText={'Cancel'}
          confirmButtonText={'Delete'}
          buttonColor={'danger'}
          defaultFocusedButton="confirm"
        >
          {warningBody}
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }
}
