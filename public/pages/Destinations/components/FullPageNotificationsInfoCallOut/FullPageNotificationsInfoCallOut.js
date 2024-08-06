/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSmallButton, EuiEmptyPrompt, EuiLink, EuiPanel, EuiText } from '@elastic/eui';
import { NOTIFICATIONS_LEARN_MORE_HREF } from '../../utils/constants';
import { getManageChannelsUrl } from '../../../../utils/helpers';

const noNotificationsTitle = 'Destinations will become channels in Notifications';
const noNotificationsText = (
  <EuiText>
    Destinations will be deprecated going forward. Install the Notifications plugin for a new
    centralized place to manage your notification channels.
  </EuiText>
);
const noNotificationsButton = (
  <EuiSmallButton
    external
    fill
    href={NOTIFICATIONS_LEARN_MORE_HREF}
    target={'_blank'}
    iconSide={'right'}
    iconType={'popout'}
  >
    View install instructions
  </EuiSmallButton>
);

const hasNotificationsTitle = 'Destinations have become channels in Notifications';
const hasNotificationsText = (
  <EuiText size="s">
    <p>
      Your destinations have been migrated as channels in Notifications, a new centralized place to
      manage your notification channels. Destinations will be deprecated going forward.&nbsp;
      <EuiLink external href={NOTIFICATIONS_LEARN_MORE_HREF} target={'_blank'}>
        Learn more
      </EuiLink>
    </p>
  </EuiText>
);

const FullPageNotificationsInfoCallOut = ({ hasNotificationPlugin }) => {
  const hasNotificationsButton = (
    <EuiSmallButton fill href={getManageChannelsUrl()}>
      View in Notifications
    </EuiSmallButton>
  );

  return (
    <EuiPanel>
      <EuiEmptyPrompt
        title={<h2>{hasNotificationPlugin ? hasNotificationsTitle : noNotificationsTitle}</h2>}
        body={hasNotificationPlugin ? hasNotificationsText : noNotificationsText}
        actions={hasNotificationPlugin ? hasNotificationsButton : noNotificationsButton}
      />
    </EuiPanel>
  );
};

export default FullPageNotificationsInfoCallOut;
