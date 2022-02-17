/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';
import AddSenderButton from '../AddSenderButton/AddSenderButton';

const senderEmptyText =
  'A sender specifies the sender name, sender email, port, host, ' +
  'and encryption method for your destination(s). You can reuse the same sender across different destinations ' +
  'or create as many senders as needed.';
const addSenderButton = (arrayHelpers) => <AddSenderButton arrayHelpers={arrayHelpers} />;

const SenderEmptyPrompt = ({ arrayHelpers }) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <h1>You have no sender set up</h1>
        <p>{senderEmptyText}</p>
      </EuiText>
    }
    actions={addSenderButton(arrayHelpers)}
  />
);

export default SenderEmptyPrompt;
