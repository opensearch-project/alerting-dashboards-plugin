/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiButton, EuiEmptyPrompt, EuiText } from '@elastic/eui';

const EmptyHistory = ({ onShowTrigger }) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <p>
          There are no triggers. Create a trigger to start alerting. Once an alarm is triggered, the
          state will be displayed in time series.
        </p>
      </EuiText>
    }
    actions={
      <EuiButton fill onClick={onShowTrigger}>
        Edit monitor
      </EuiButton>
    }
  />
);

EmptyHistory.propTypes = {
  onShowTrigger: PropTypes.func.isRequired,
};

export default EmptyHistory;
