/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const API_ROUTE_PREFIX = '/_plugins/_alerting';

export const INDEX = {
  OPENSEARCH_ALERTING_CONFIG: '.opendistro-alerting-config',
  SAMPLE_DATA_ECOMMERCE: 'opensearch_dashboards_sample_data_ecommerce',
  SAMPLE_DATA_FLIGHTS: 'opensearch_dashboards_sample_data_flights',
};

export const API = {
  MONITOR_BASE: `${API_ROUTE_PREFIX}/monitors`,
  WORKFLOW_BASE: `${API_ROUTE_PREFIX}/workflows`,
  DESTINATION_BASE: `${API_ROUTE_PREFIX}/destinations`,
};

export const PLUGIN_NAME = 'alerting';

export const ADMIN_AUTH = {
  username: 'admin',
  password: 'admin',
};
