/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Message from '../actions/index';

export const ActionsMap = {
  slack: {
    label: 'Slack notification',
    component: (props) => <Message {...props} />,
  },
  chime: {
    label: 'Amazon Chime notification',
    component: (props) => <Message {...props} />,
  },
  custom_webhook: {
    label: 'Custom webhook',
    component: (props) => <Message isSubjectDisabled {...props} />,
  },
  webhook: {
    label: 'Custom webhook',
    component: (props) => <Message isSubjectDisabled {...props} />,
  },
  email: {
    label: 'Email notification',
    component: (props) => <Message {...props} />,
  },
};
