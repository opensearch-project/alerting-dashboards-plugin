/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';

import { EuiConfirmModal, EuiOverlayMask, EUI_MODAL_CANCEL_BUTTON } from '@elastic/eui';

const propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const DeleteConfirmation = ({ isVisible, onConfirm, onCancel }) => {
  return isVisible ? (
    <EuiOverlayMask>
      <EuiConfirmModal
        title="Delete this destination?"
        onCancel={onCancel}
        onConfirm={onConfirm}
        cancelButtonText="No"
        confirmButtonText="Yes"
        buttonColor="danger"
        defaultFocusedButton={EUI_MODAL_CANCEL_BUTTON}
      />
    </EuiOverlayMask>
  ) : null;
};

DeleteConfirmation.propTypes = propTypes;

export default DeleteConfirmation;
