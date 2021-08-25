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

export const OPEN_SEARCH_PREFIX = 'opendistro';

export const PLUGIN_NAME = `alerting`;
export const INDEX_PREFIX = `${OPEN_SEARCH_PREFIX}-alerting`;
export const INDEX = {
  SCHEDULED_JOBS: `.${INDEX_PREFIX}-config`,
  ALERTS: `.${INDEX_PREFIX}-alerts`,
  ALL_ALERTS: `.${INDEX_PREFIX}-alert*`,
  ALERT_HISTORY_WRITE: `.${INDEX_PREFIX}-alert-history-write`,
};

export const URL = {
  MUSTACHE: 'https://mustache.github.io/mustache.5.html',
  DOCUMENTATION: 'https://docs-beta.opensearch.org/monitoring-plugins/alerting/',
  CREATE_MONITOR_DOCUMENTATION:
    'https://opensearch.org/docs/monitoring-plugins/alerting/monitors/#create-monitors',
};

export const MAX_THROTTLE_VALUE = 1440;
export const WRONG_THROTTLE_WARNING = `Throttle value must be greater than 0 and less than ${MAX_THROTTLE_VALUE}.`;
