/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiLink, EuiText, EuiTitle } from '@elastic/eui';
import { URL } from '../../../../utils/constants';

const message = () => ({
  flyoutProps: {
    'aria-labelledby': 'messageFlyout',
    maxWidth: 500,
    size: 'm',
  },
  headerProps: { hasBorder: true },
  header: (
    <EuiTitle size="m" style={{ fontSize: '25px' }}>
      <h2>
        <strong>Message</strong>
      </h2>
    </EuiTitle>
  ),
  body: (
    <EuiText style={{ fontSize: '14px' }}>
      <p>
        {`You have access to a "ctx" variable in your painless scripts and action mustache templates.`}
      </p>
      <h3>Learn More</h3>
      <ul>
        <li>
          <EuiLink target="_blank" href={URL.MUSTACHE} external>
            HTML Templates with Mustache.js
          </EuiLink>
        </li>
      </ul>
    </EuiText>
  ),
});

export default message;
