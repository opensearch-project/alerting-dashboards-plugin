/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiText } from '@elastic/eui';
import AddActionButton from '../AddActionButton';
import { PLUGIN_NAME } from '../../../../../utils/constants';

const actionEmptyText = 'Add an action to perform when this trigger is triggered.';
const destinationEmptyText =
  'There are no existing destinations. Add a destinations to create an action.';
const createDestinationButton = (
  <EuiButton fill href={`${PLUGIN_NAME}#/create-destination`}>
    Add destination
  </EuiButton>
);
const addActionButton = (arrayHelpers) => <AddActionButton arrayHelpers={arrayHelpers} />;

const ActionEmptyPrompt = ({ arrayHelpers, hasDestinations }) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <p>{hasDestinations ? actionEmptyText : destinationEmptyText}</p>
      </EuiText>
    }
    actions={hasDestinations ? addActionButton(arrayHelpers) : createDestinationButton}
  />
);

export default ActionEmptyPrompt;
