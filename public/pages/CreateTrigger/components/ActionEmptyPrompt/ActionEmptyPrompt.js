/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSmallButton, EuiEmptyPrompt, EuiText } from '@elastic/eui';
import AddActionButton from '../AddActionButton';
import { getManageChannelsUrl } from '../../../../utils/helpers';

const actionEmptyText = 'Add an action to perform when this trigger is triggered.';
const destinationEmptyText = 'There are no existing channels. Add a channel to create an action.';

const ActionEmptyPrompt = ({
  arrayHelpers,
  hasDestinations,
  hasNotificationPlugin,
  flyoutMode,
  onPostAdd,
  numActions,
}) =>
  flyoutMode ? (
    <AddActionButton {...{ arrayHelpers, flyoutMode, onPostAdd, numActions }} />
  ) : (
    <EuiEmptyPrompt
      style={{ maxWidth: '45em' }}
      body={
        <EuiText size="s">
          <p>{hasDestinations ? actionEmptyText : destinationEmptyText}</p>
        </EuiText>
      }
      actions={
        hasDestinations ? (
          <AddActionButton {...{ arrayHelpers, flyoutMode, onPostAdd, numActions }} />
        ) : (
          <EuiSmallButton
            fill
            disabled={!hasNotificationPlugin}
            iconType="popout"
            iconSide="right"
            onClick={() => window.open(getManageChannelsUrl())}
          >
            Manage channels
          </EuiSmallButton>
        )
      }
    />
  );

export default ActionEmptyPrompt;
