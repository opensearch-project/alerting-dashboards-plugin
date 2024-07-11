/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';

export const ConfirmUnlinkDetectorModal = (props) => {
  const [isModalLoading, setIsModalLoading] = useState(false);
  const isLoading = isModalLoading || props.isListLoading;
  return (
    <EuiOverlayMask>
      <EuiModal data-test-subj="startDetectorsModal" onClose={props.onHide} maxWidth={450}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>{'Remove association?'}&nbsp;</EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <EuiText>
            Removing association unlinks {props.monitor.name} monitor from the visualization but
            does not delete it. The monitor association can be restored.
          </EuiText>
          <EuiSpacer size="s" />
        </EuiModalBody>
        <EuiModalFooter>
          {isLoading ? null : (
            <EuiSmallButtonEmpty data-test-subj="cancelButton" onClick={props.onHide}>
              Cancel
            </EuiSmallButtonEmpty>
          )}
          <EuiSmallButton
            data-test-subj="confirmButton"
            color="primary"
            fill
            isLoading={isLoading}
            onClick={async () => {
              setIsModalLoading(true);
              props.onConfirm();
            }}
          >
            {'Remove association'}
          </EuiSmallButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
};
