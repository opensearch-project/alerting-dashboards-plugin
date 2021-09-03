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

// Keeping index prefix as 'opendistro' as migrating the system index is currently difficult to complete
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
};

export const MAX_THROTTLE_VALUE = 1440;
export const WRONG_THROTTLE_WARNING =
  'Throttle value must be greater than 0 and less than ' + MAX_THROTTLE_VALUE;
