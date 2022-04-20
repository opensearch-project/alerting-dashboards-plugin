/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';

const senderEmptyText =
  'A sender specifies the sender name, sender email, port, host, ' +
  'and encryption method for your destination(s). You can reuse the same sender across different destinations ' +
  'or create as many senders as needed.';

const SenderEmptyPrompt = () => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <h1>You have no sender set up</h1>
        <p>{senderEmptyText}</p>
      </EuiText>
    }
  />
);

export default SenderEmptyPrompt;
