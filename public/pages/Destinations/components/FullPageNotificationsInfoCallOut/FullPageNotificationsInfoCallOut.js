/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiButton, EuiEmptyPrompt, EuiLink, EuiPanel, EuiText } from '@elastic/eui';
import { MANAGE_CHANNELS_PATH } from '../../../CreateTrigger/utils/constants';
import { NOTIFICATIONS_LEARN_MORE_HREF } from '../../utils/constants';

const noNotificationsTitle = 'Destinations will become channels in Notifications';
const noNotificationsText = (
  <EuiText>
    Destinations will be deprecated going forward. Install the Notifications plugin for a new
    centralized place to manage your notification channels.
  </EuiText>
);
const noNotificationsButton = (
  <EuiButton
    external
    fill
    href={NOTIFICATIONS_LEARN_MORE_HREF}
    target={'_blank'}
    iconSide={'right'}
    iconType={'popout'}
  >
    View install instructions
  </EuiButton>
);

const hasNotificationsTitle = 'Destinations have become channels in Notifications';
const hasNotificationsText = (
  <EuiText>
    <p>
      Your destinations have been migrated as channels in Notifications, a new centralized place to
      manage your notification channels. Destinations will be deprecated going forward.&nbsp;
      <EuiLink external href={NOTIFICATIONS_LEARN_MORE_HREF} target={'_blank'}>
        Learn more
      </EuiLink>
    </p>
  </EuiText>
);
const hasNotificationsButton = (
  <EuiButton fill href={MANAGE_CHANNELS_PATH}>
    View in Notifications
  </EuiButton>
);

const FullPageNotificationsInfoCallOut = ({ hasNotificationPlugin }) => (
  <EuiPanel>
    <EuiEmptyPrompt
      title={<h2>{hasNotificationPlugin ? hasNotificationsTitle : noNotificationsTitle}</h2>}
      body={hasNotificationPlugin ? hasNotificationsText : noNotificationsText}
      actions={hasNotificationPlugin ? hasNotificationsButton : noNotificationsButton}
    />
  </EuiPanel>
);

export default FullPageNotificationsInfoCallOut;
