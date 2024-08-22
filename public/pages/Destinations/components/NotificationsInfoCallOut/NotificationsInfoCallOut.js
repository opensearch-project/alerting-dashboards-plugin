/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiSmallButton, EuiLink, EuiSpacer } from '@elastic/eui';
import { NOTIFICATIONS_LEARN_MORE_HREF } from '../../utils/constants';
import { getManageChannelsUrl } from '../../../../utils/helpers';

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
  <EuiSmallButton
    external
    href={NOTIFICATIONS_LEARN_MORE_HREF}
    iconSide={'right'}
    iconType={'popout'}
    target={'_blank'}
  >
    View install instructions
  </EuiSmallButton>
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

const NotificationsInfoCallOut = ({ hasNotificationPlugin }) => {
  const hasNotificationsButton = (
    <EuiSmallButton href={getManageChannelsUrl()}>View in Notifications</EuiSmallButton>
  );

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
