/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiButton, EuiLink, EuiSpacer } from '@elastic/eui';
import { MANAGE_CHANNELS_PATH } from '../../../CreateTrigger/utils/constants';
import { NOTIFICATIONS_LEARN_MORE_HREF } from '../../utils/constants';

const noNotificationsTitle = 'Unable to send notifications. Notifications plugin is required.';
const noNotificationsBodyText = (
  <>
    <p>
      Destinations will be deprecated going forward. Install the Notifications plugin for a new
      centralized place to manage your notification channels.
    </p>
    <p>
      Existing destinations will be automatically migrated once Notifications plugin is installed.
    </p>
  </>
);
const noNotificationsButton = (
  <EuiButton
    external
    href={NOTIFICATIONS_LEARN_MORE_HREF}
    iconSide={'right'}
    iconType={'popout'}
    target={'_blank'}
  >
    View install instructions
  </EuiButton>
);

const hasNotificationsTitle = 'Destinations have become channels in Notifications.';
const hasNotificationsBodyText = (
  <p>
    Your destinations have been migrated to Notifications, a new centralized place to manage your
    notification channels. Destinations will be deprecated going forward.&nbsp;
    <EuiLink external href={NOTIFICATIONS_LEARN_MORE_HREF} target={'_blank'}>
      Learn more
    </EuiLink>
  </p>
);
const hasNotificationsButton = (
  <EuiButton href={MANAGE_CHANNELS_PATH}>View in Notifications</EuiButton>
);

const NotificationsInfoCallOut = ({ hasNotificationPlugin }) => {
  return (
    <div>
      <EuiCallOut
        color={hasNotificationPlugin ? 'primary' : 'danger'}
        iconType={hasNotificationPlugin ? undefined : 'alert'}
        title={hasNotificationPlugin ? hasNotificationsTitle : noNotificationsTitle}
      >
        {hasNotificationPlugin ? hasNotificationsBodyText : noNotificationsBodyText}
        <EuiSpacer size={'l'} />
        {hasNotificationPlugin ? hasNotificationsButton : noNotificationsButton}
      </EuiCallOut>
      <EuiSpacer size={'l'} />
    </div>
  );
};

export default NotificationsInfoCallOut;
