/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiTitle } from '@elastic/eui';

const messageFrequency = () => ({
  flyoutProps: {
    'aria-labelledby': 'messageFrequencyFlyout',
    maxWidth: 500,
    size: 'm',
  },
  headerProps: { hasBorder: true },
  header: (
    <EuiTitle size="m" style={{ fontSize: '25px' }}>
      <h2>
        <strong>Message frequency</strong>
      </h2>
    </EuiTitle>
  ),
  body: (
    <EuiText style={{ fontSize: '14px' }}>
      <p>
        Specify message frequency to limit the number of notifications you receive within a given
        span of time. This setting is especially useful for low severity trigger conditions.
      </p>
      <p>Consider the following example:</p>
      <ul>
        <li>A trigger condition is met.</li>
        <li>The monitor sends a message</li>
        <li>Message frequency is set to 10 minutes.</li>
      </ul>
      <p>
        For the next 10 minutes, even if a trigger condition is met dozens of times, the monitor
        sends no additional messages. If the trigger condition is met 11 minutes later, the monitor
        sends another message.
      </p>
    </EuiText>
  ),
});

export default messageFrequency;
