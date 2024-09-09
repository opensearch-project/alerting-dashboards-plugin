/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Message from '../components/Action/actions';

export const DEFAULT_MESSAGE_SOURCE = {
  BUCKET_LEVEL_MONITOR: `
  Monitor {{ctx.monitor.name}} just entered alert status. Please investigate the issue.
  - Trigger: {{ctx.trigger.name}}
  - Severity: {{ctx.trigger.severity}}
  - Period start: {{ctx.periodStart}}
  - Period end: {{ctx.periodEnd}}

  - Deduped Alerts:
  {{#ctx.dedupedAlerts}}
    * {{id}} : {{bucket_keys}}
  {{/ctx.dedupedAlerts}}

  - New Alerts:
  {{#ctx.newAlerts}}
    * {{id}} : {{bucket_keys}}
  {{/ctx.newAlerts}}

  - Completed Alerts:
  {{#ctx.completedAlerts}}
    * {{id}} : {{bucket_keys}}
  {{/ctx.completedAlerts}}
  `.trim(),
  QUERY_LEVEL_MONITOR: `
  Monitor {{ctx.monitor.name}} just entered alert status. Please investigate the issue.
  - Trigger: {{ctx.trigger.name}}
  - Severity: {{ctx.trigger.severity}}
  - Period start: {{ctx.periodStart}}
  - Period end: {{ctx.periodEnd}}
  `.trim(),
};

export const FORMIK_INITIAL_ACTION_VALUES = {
  name: '',
  destination_id: '',
  subject_template: {
    lang: 'mustache',
    source: 'Alerting Notification action',
  },
  message_template: {
    lang: 'mustache',
    source: DEFAULT_MESSAGE_SOURCE.QUERY_LEVEL_MONITOR,
  },
  throttle_enabled: false,
  throttle: {
    value: 10,
    unit: 'MINUTES', // throttle unit only supports MINUTES currently, no UI element mapped
  },
};

export const THRESHOLD_ENUM_OPTIONS = [
  { value: 'ABOVE', text: 'IS ABOVE' },
  { value: 'BELOW', text: 'IS BELOW' },
  { value: 'EXACTLY', text: 'IS EXACTLY' },
];

export const DEFAULT_AND_OR_CONDITION = 'AND';
export const AND_OR_CONDITION_OPTIONS = [
  { value: 'AND', text: 'AND' },
  { value: 'OR', text: 'OR' },
];

export const DEFAULT_TRIGGER_NAME = 'New trigger';
export const DEFAULT_ACTION_TYPE = 'slack';

export const webhookNotificationActionMessageComponent = (props) => (
  <Message isSubjectDisabled {...props} />
);
export const defaultNotificationActionMessageComponent = (props) => <Message {...props} />;
