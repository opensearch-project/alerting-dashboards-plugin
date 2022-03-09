/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCodeBlock, EuiCodeEditor, EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';

const CONTEXT_VARIABLES = JSON.stringify(
  {
    monitor: '...',
    trigger: '...',
    results: '...',
    periodStart: '...',
    periodEnd: '...',
    alert: '...',
    error: '...',
  },
  null,
  4
);

const triggerCondition = (context) => ({
  flyoutProps: {
    'aria-labelledby': 'triggerConditionFlyout',
    maxWidth: 500,
    size: 'm',
  },
  headerProps: { hasBorder: true },
  header: (
    <EuiTitle size="m" style={{ fontSize: '25px' }}>
      <h2>
        <strong>Trigger condition</strong>
      </h2>
    </EuiTitle>
  ),
  body: (
    <div>
      <EuiText style={{ fontSize: '14px' }}>
        <p>You have access to a "ctx" variable in your painless scripts</p>
        <p>
          Below shows a quick JSON example of what's available under the "ctx" variable along with
          the actual results (where possible) for you to reference.
        </p>
      </EuiText>

      <EuiSpacer size="m" />

      <EuiCodeBlock language="json">{CONTEXT_VARIABLES}</EuiCodeBlock>

      <EuiSpacer size="m" />

      <EuiCodeEditor
        mode="json"
        theme="github"
        width="100%"
        height="700px"
        readOnly
        value={JSON.stringify(context, null, 4)}
        setOptions={{ fontSize: '12px' }}
      />
    </div>
  ),
});

export default triggerCondition;
