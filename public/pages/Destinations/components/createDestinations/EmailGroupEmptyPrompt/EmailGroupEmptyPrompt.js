/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';

const emailGroupEmptyText =
  'Use an email group to manage a list of email addresses you frequently send to at the same time. ' +
  'You can create as many email groups as needed and use them together with individual email addresses when ' +
  'specifying recipients.';

const EmailGroupEmptyPrompt = () => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <h1>You have no email group set up</h1>
        <p>{emailGroupEmptyText}</p>
      </EuiText>
    }
  />
);

export default EmailGroupEmptyPrompt;
