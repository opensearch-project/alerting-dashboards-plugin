/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';
import AddTriggerButton from '../AddTriggerButton';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../containers/CreateTrigger/utils/constants';

const addTriggerButton = (arrayHelpers, script) => (
  <AddTriggerButton arrayHelpers={arrayHelpers} script={script} />
);

const TriggerEmptyPrompt = ({ arrayHelpers, script = FORMIK_INITIAL_TRIGGER_VALUES.script }) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <h4>No triggers</h4>
        <p>Add a trigger to define conditions and actions.</p>
      </EuiText>
    }
    actions={addTriggerButton(arrayHelpers, script)}
  />
);

export default TriggerEmptyPrompt;
