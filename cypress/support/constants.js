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
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

export const API_ROUTE_PREFIX = '/_plugins/_alerting';

export const INDEX = {
  OPENSEARCH_ALERTING_CONFIG: '.opendistro-alerting-config',
};

export const API = {
  MONITOR_BASE: `${API_ROUTE_PREFIX}/monitors`,
  DESTINATION_BASE: `${API_ROUTE_PREFIX}/destinations`,
};

export const PLUGIN_NAME = 'alerting';

export const ADMIN_AUTH = {
  username: 'admin',
  password: 'admin',
};
