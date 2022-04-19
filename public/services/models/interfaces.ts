/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CHANNEL_TYPE } from "../../utils/constants";

interface ConfigType {
  config_id: string;
  name: string;
  description?: string;
  created_time_ms: number;
  last_updated_time_ms: number;
}

export interface ChannelItemType extends ConfigType {
  config_type: keyof typeof CHANNEL_TYPE;
  is_enabled: boolean; // active or muted
  slack?: {
    url: string;
  };
  chime?: {
    url: string;
  };
  webhook?: {
    url: string;
    header_params: object;
  };
  email?: {
    email_account_id: string;
    recipient_list: { [recipient: string]: string }[]; // custom email addresses
    email_group_id_list: string[];
    // optional fields for displaying or editing email channel, needs more requests
    email_account_name?: string;
    email_group_id_map?: {
      [id: string]: string;
    };
  };
}
