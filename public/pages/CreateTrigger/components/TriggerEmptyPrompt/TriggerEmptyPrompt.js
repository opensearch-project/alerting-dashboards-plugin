/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';
import AddTriggerButton from '../AddTriggerButton';

const addTriggerButton = (arrayHelpers) => <AddTriggerButton arrayHelpers={arrayHelpers} />;

const TriggerEmptyPrompt = ({ arrayHelpers }) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <h4>No triggers</h4>
        <p>Add a trigger to define conditions and actions.</p>
      </EuiText>
    }
    actions={addTriggerButton(arrayHelpers)}
  />
);

export default TriggerEmptyPrompt;
