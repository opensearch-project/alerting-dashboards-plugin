/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DESTINATION_TYPE = {
  CHIME: 'chime',
  SLACK: 'slack',
  CUSTOM_HOOK: 'custom_webhook',
  EMAIL: 'email',
};

export const DESTINATION_OPTIONS = [
  { value: DESTINATION_TYPE.CHIME, text: 'Amazon Chime' },
  { value: DESTINATION_TYPE.SLACK, text: 'Slack' },
  { value: DESTINATION_TYPE.CUSTOM_HOOK, text: 'Custom webhook' },
  { value: DESTINATION_TYPE.EMAIL, text: 'Email' },
];

export const ALLOW_LIST_SETTING_PATH = 'plugins.alerting.destination.allow_list';
