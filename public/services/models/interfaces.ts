/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */


import { CHANNEL_TYPE, NOTIFICATION_SOURCE } from "../../utils/constants";

interface ConfigType {
  config_id: string;
  name: string;
  description?: string;
  created_time_ms: number;
  last_updated_time_ms: number;
}

export interface ChannelItemType extends ConfigType {
  config_type: keyof typeof CHANNEL_TYPE;
  feature_list: Array<keyof typeof NOTIFICATION_SOURCE>;
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
    recipient_list: string[]; // custom email addresses
    email_group_id_list: string[];
    // optional fields for displaying or editing email channel, needs more requests
    email_account_name?: string;
    email_group_id_map?: {
      [id: string]: string;
    };
  };
}
