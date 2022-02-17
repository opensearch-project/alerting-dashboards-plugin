/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';
import AddEmailGroupButton from '../AddEmailGroupButton/AddEmailGroupButton';

const emailGroupEmptyText =
  'Use an email group to manage a list of email addresses you frequently send to at the same time. ' +
  'You can create as many email groups as needed and use them together with individual email addresses when ' +
  'specifying recipients.';
const addEmailGroupButton = (arrayHelpers) => <AddEmailGroupButton arrayHelpers={arrayHelpers} />;

const EmailGroupEmptyPrompt = ({ arrayHelpers }) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <h1>You have no email group set up</h1>
        <p>{emailGroupEmptyText}</p>
      </EuiText>
    }
    actions={addEmailGroupButton(arrayHelpers)}
  />
);

export default EmailGroupEmptyPrompt;
