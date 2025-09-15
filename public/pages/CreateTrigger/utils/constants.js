/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Message from '../components/Action/actions';

export const DEFAULT_MESSAGE_SOURCE = {
  LEGACY: {
    BUCKET_LEVEL_MONITOR: `
      Monitor {{ctx.monitor.name}} just entered alert status. Please investigate the issue.
      - Trigger: {{ctx.trigger.name}}
      - Severity: {{ctx.trigger.severity}}
      - Period start: {{ctx.periodStart}} UTC
      - Period end: {{ctx.periodEnd}} UTC

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
      - Period start: {{ctx.periodStart}} UTC
      - Period end: {{ctx.periodEnd}} UTC
    `.trim(),
  },
  V2: {
    BUCKET_LEVEL_MONITOR: `
      Monitor {{ctx.monitorV2.name}} just entered alert status. Please investigate the issue.
      {{#ctx.ppl_sql_trigger}}
      - Trigger: {{name}}
      - Severity: {{severity}}
      - Mode: {{mode}}
      - Condition type: {{type}}
      {{#num_results_condition}}
      - Num results condition: {{.}}
      {{/num_results_condition}}
      {{#num_results_value}}
      - Num results value: {{.}}
      {{/num_results_value}}
      {{#custom_condition}}
      - Custom condition: {{.}}
      {{/custom_condition}}
      {{#throttle}}
      - Throttle (minutes): {{.}}
      {{/throttle}}
      {{#expire}}
      - Expire (minutes): {{.}}
      {{/expire}}
      {{/ctx.ppl_sql_trigger}}
      {{#ctx.monitorV2.query}}
      - Query: {{.}}
      {{/ctx.monitorV2.query}}
    `.trim(),
    QUERY_LEVEL_MONITOR: `
      Monitor {{ctx.monitorV2.name}} just entered alert status. Please investigate the issue.
      {{#ctx.ppl_sql_trigger}}
      - Trigger: {{name}}
      - Severity: {{severity}}
      - Mode: {{mode}}
      - Condition type: {{type}}
      {{#num_results_condition}}
      - Num results condition: {{.}}
      {{/num_results_condition}}
      {{#num_results_value}}
      - Num results value: {{.}}
      {{/num_results_value}}
      {{#custom_condition}}
      - Custom condition: {{.}}
      {{/custom_condition}}
      {{#throttle}}
      - Throttle (minutes): {{.}}
      {{/throttle}}
      {{#expire}}
      - Expire (minutes): {{.}}
      {{/expire}}
      {{/ctx.ppl_sql_trigger}}
      {{#ctx.monitorV2.query}}
      - Query: {{.}}
      {{/ctx.monitorV2.query}}
    `.trim(),
  },
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
    source: DEFAULT_MESSAGE_SOURCE.V2.QUERY_LEVEL_MONITOR,
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
