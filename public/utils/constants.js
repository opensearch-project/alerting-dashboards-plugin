/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { euiPaletteForStatus } from '@elastic/eui';

export const ALERT_STATE = Object.freeze({
  ACTIVE: 'ACTIVE',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR',
  DELETED: 'DELETED',
});

export const DEFAULT_EMPTY_DATA = '-';

export const APP_PATH = {
  CREATE_MONITOR: '/create-monitor',
  CREATE_DESTINATION: '/create-destination',
};

export const SEARCH_TYPE = {
  GRAPH: 'graph',
  QUERY: 'query',
  AD: 'ad',
  CLUSTER_METRICS: 'clusterMetrics',
};

export const MONITOR_TYPE = {
  QUERY_LEVEL: 'query_level_monitor',
  BUCKET_LEVEL: 'bucket_level_monitor',
  CLUSTER_METRICS: 'cluster_metrics_monitor',
  DOC_LEVEL: 'doc_level_monitor',
  COMPOSITE_LEVEL: 'composite',
};

export const DESTINATION_ACTIONS = {
  UPDATE_DESTINATION: 'update-destination',
};

export const MONITOR_ACTIONS = {
  UPDATE_MONITOR: 'update-monitor',
};

export const TRIGGER_ACTIONS = {
  UPDATE_TRIGGER: 'update-trigger',
  CREATE_TRIGGER: 'create-trigger',
};

export const DATA_TYPES = {
  NUMBER: 'number',
  TEXT: 'text',
  BOOLEAN: 'boolean',
  KEYWORD: 'keyword',
};

export const OS_AD_PLUGIN = 'opensearch-anomaly-detection';
export const OS_NOTIFICATION_PLUGIN = 'opensearch-notifications';
export const OPENSEARCH_DASHBOARDS_AD_PLUGIN = 'anomaly-detection-dashboards';

export const INPUTS_DETECTOR_ID = '0.search.query.query.bool.filter[1].term.detector_id.value';

export const MONITOR_INPUT_DETECTOR_ID = `inputs.${INPUTS_DETECTOR_ID}`;

export const AD_PREVIEW_DAYS = 7;

export const MAX_QUERY_RESULT_SIZE = 200;
export const MAX_CHANNELS_RESULT_SIZE = 5000;

export const MONITOR_GROUP_BY = 'ui_metadata.search.groupBy';

// Notification related constants

export const BACKEND_CHANNEL_TYPE = Object.freeze({
  SLACK: 'slack',
  EMAIL: 'email',
  CHIME: 'chime',
  CUSTOM_WEBHOOK: 'webhook',
  SES: 'ses',
  SNS: 'sns',
});

export const CHANNEL_TYPE = Object.freeze({
  [BACKEND_CHANNEL_TYPE.SLACK]: 'Slack',
  [BACKEND_CHANNEL_TYPE.EMAIL]: 'Email',
  [BACKEND_CHANNEL_TYPE.CHIME]: 'Chime',
  [BACKEND_CHANNEL_TYPE.CUSTOM_WEBHOOK]: 'Custom webhook',
  [BACKEND_CHANNEL_TYPE.SES]: 'Amazon SES',
  [BACKEND_CHANNEL_TYPE.SNS]: 'Amazon SNS',
});

export const DEFAULT_PREVIEW_ERROR_MSG = 'There was a problem previewing the detector.';

export const PREVIEW_ERROR_TYPE = {
  EXCEPTION: 0,
  NO_FEATURE: 1,
  NO_ENABLED_FEATURES: 2,
  SPARSE_DATA: 3,
};

export const monitorTypesForComposition = new Set([
  MONITOR_TYPE.BUCKET_LEVEL,
  MONITOR_TYPE.DOC_LEVEL,
  MONITOR_TYPE.QUERY_LEVEL,
]);

export const PLUGIN_AUGMENTATION_ENABLE_SETTING = 'visualization:enablePluginAugmentation';

export const PLUGIN_AUGMENTATION_MAX_OBJECTS_SETTING =
  'visualization:enablePluginAugmentation.maxPluginObjects';

const paletteColors = euiPaletteForStatus(5);

export const SEVERITY_OPTIONS = [
  {
    value: '1',
    text: '1 (Highest)',
    badgeText: 'Highest',
    color: { background: paletteColors[4], text: 'white' },
  },
  {
    value: '2',
    text: '2 (High)',
    badgeText: 'High',
    color: { background: paletteColors[3], text: 'white' },
  },
  {
    value: '3',
    text: '3 (Medium)',
    badgeText: 'Medium',
    color: { background: paletteColors[2], text: 'black' },
  },
  {
    value: '4',
    text: '4 (Low)',
    badgeText: 'Low',
    color: { background: paletteColors[1], text: 'white' },
  },
  {
    value: '5',
    text: '5 (Lowest)',
    badgeText: 'Lowest',
    color: { background: paletteColors[0], text: 'white' },
  },
];
