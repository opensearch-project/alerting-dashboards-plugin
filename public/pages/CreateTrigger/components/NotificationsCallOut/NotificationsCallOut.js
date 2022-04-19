/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiLink, EuiSpacer } from '@elastic/eui';

const NotificationsCallOut = () => {
  return (
    <div>
      <EuiCallOut title="Notifications plugin is not installed" color="danger" iconType="alert">
        <p>
          Install the notifications plugin in order to create and select channels to send out
          notifications.{' '}
          <EuiLink href="#" external>
            Learn more
          </EuiLink>
          .
        </p>
      </EuiCallOut>
      <EuiSpacer size="m" />
    </div>
  );
};

export default NotificationsCallOut;
