/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { EuiCallOut, EuiButton, EuiSpacer } from '@elastic/eui';
import { MANAGE_CHANNELS_PATH } from '../../../CreateTrigger/utils/constants';

const NotificationsInfoCallOut = (hasNotificationPlugin) => {
  return (
    <div>
      <EuiCallOut title="Destinations have become channels in Notifications.">
        <p>
          Your destinations have been migrated to Notifications, a new centralized place to manage
          your notification channels. Destinations will be deprecated going forward.
          <EuiSpacer size="l" />
          {hasNotificationPlugin && (
            <EuiButton href={MANAGE_CHANNELS_PATH}>View Notifications</EuiButton>
          )}
        </p>
      </EuiCallOut>
      <EuiSpacer size="l" />
    </div>
  );
};

export default NotificationsInfoCallOut;
