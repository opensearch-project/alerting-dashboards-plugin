/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DESTINATION_TYPE } from '../../Destinations/utils/constants';
import { BACKEND_CHANNEL_TYPE } from '../../../utils/constants';

export const getChannelOptions = (channels, allowedTypes) =>
  allowedTypes.map((type) => ({
    label: type,
    options: channels.filter((channel) => channel.type === type),
  }));

// Custom Webhooks for Destinations used `custom_webhook` for the type whereas Notification Channels use 'webhook'
// This conversion ensures Notifications' nomenclature is used for the labeling for consistency
export const toChannelType = (type) => {
  if (type === DESTINATION_TYPE.CUSTOM_HOOK) {
    return BACKEND_CHANNEL_TYPE.CUSTOM_WEBHOOK;
  }

  return type;
};
