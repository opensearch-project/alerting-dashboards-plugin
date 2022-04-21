/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiText } from '@elastic/eui';
import AddActionButton from '../AddActionButton';
import { MANAGE_CHANNELS_PATH } from '../../utils/constants';

const actionEmptyText = 'Add an action to perform when this trigger is triggered.';
const destinationEmptyText = 'There are no existing channels. Add a channel to create an action.';
const manageChannelsButton = (httpClient, hasNotificationPlugin) => (
  <EuiButton
    fill
    disabled={!hasNotificationPlugin}
    iconType="popout"
    iconSide="right"
    onClick={() => window.open(httpClient.basePath.prepend(MANAGE_CHANNELS_PATH))}
  >
    Manage channels
  </EuiButton>
);
const addActionButton = (arrayHelpers) => <AddActionButton arrayHelpers={arrayHelpers} />;

const ActionEmptyPrompt = ({
  arrayHelpers,
  hasDestinations,
  httpClient,
  hasNotificationPlugin,
}) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <p>{hasDestinations ? actionEmptyText : destinationEmptyText}</p>
      </EuiText>
    }
    actions={
      hasDestinations
        ? addActionButton(arrayHelpers)
        : manageChannelsButton(httpClient, hasNotificationPlugin)
    }
  />
);

export default ActionEmptyPrompt;
