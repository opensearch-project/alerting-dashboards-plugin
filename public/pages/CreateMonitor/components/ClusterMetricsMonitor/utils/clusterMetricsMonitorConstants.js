/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { DEFAULT_EMPTY_DATA } from '../../../../../utils/constants';

export const URL_DEFAULT_PREFIX = 'http://localhost:9200';
export const API_PATH_REQUIRED_PLACEHOLDER_TEXT = 'Select an API.';
export const EMPTY_PATH_PARAMS_TEXT = 'Enter remaining path components and path parameters';
export const GET_API_TYPE_DEBUG_TEXT =
  'Cannot determine ApiType in clusterMetricsMonitorHelpers::getSelectedApiType.';
export const ILLEGAL_PATH_PARAMETER_CHARACTERS = [
  ':',
  '"',
  '+',
  '\\',
  '|',
  '?',
  '#',
  '>',
  '<',
  ' ',
];
export const NO_PATH_PARAMS_PLACEHOLDER_TEXT = 'No path parameter options';
export const PATH_PARAMETER_ILLEGAL_CHARACTER_TEXT = `The provided path parameters contain invalid characters or spaces. Please omit: ${ILLEGAL_PATH_PARAMETER_CHARACTERS.join(
  ' '
)}`;
export const PATH_PARAMETERS_REQUIRED_TEXT = 'Path parameters are required for this API.';
export const REST_API_REFERENCE = 'https://opensearch.org/docs/latest/opensearch/rest-api/index/';
export const DEFAULT_CLUSTER_METRICS_SCRIPT = {
  lang: 'painless',
  source: 'ctx.results[0] != null',
};

export const CLUSTER_METRICS_CROSS_CLUSTER_ALERT_TABLE_COLUMN = {
  field: 'clusters',
  name: 'Triggered clusters',
  sortable: true,
  truncateText: true,
  render: (clusters = [DEFAULT_EMPTY_DATA]) => _.sortBy(clusters).join(', '),
};

export const API_TYPES = {
  CLUSTER_HEALTH: {
    type: 'CLUSTER_HEALTH',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cluster-health/',
    exampleText: 'indexAlias1,indexAlias2...',
    label: 'Cluster health',
    paths: {
      withPathParams: '_cluster/health',
      withoutPathParams: '_cluster/health',
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: 'ctx.results[0].status != "green"',
    },
  },
  CLUSTER_STATS: {
    type: 'CLUSTER_STATS',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cluster-stats/',
    exampleText: 'nodeFilter1,nodeFilter2...',
    label: 'Cluster stats',
    paths: {
      withPathParams: '_cluster/stats/nodes',
      withoutPathParams: '_cluster/stats',
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: 'ctx.results[0].indices.count <= 0',
    },
  },
  CLUSTER_SETTINGS: {
    type: 'CLUSTER_SETTINGS',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cluster-settings/',
    exampleText: undefined,
    label: 'Cluster settings',
    paths: {
      withPathParams: undefined,
      withoutPathParams: '_cluster/settings',
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: 'ctx.results[0].transient != null',
    },
  },
  NODES_STATS: {
    type: 'NODES_STATS',
    documentation: 'https://opensearch.org/docs/latest/opensearch/popular-api/#get-node-statistics',
    exampleText: undefined,
    label: 'Nodes stats',
    paths: {
      withPathParams: undefined,
      withoutPathParams: '_nodes/stats',
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: 'ctx.results[0].nodes.NODE_ID.jvm.mem.heap_used_percent > 60',
    },
  },
  CAT_INDICES: {
    type: 'CAT_INDICES',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-indices/',
    exampleText: 'index1,index2...',
    label: 'List indices',
    paths: {
      withPathParams: '_cat/indices',
      withoutPathParams: '_cat/indices',
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: `for (int i = 0; i < ctx.results[0].indices.size(); ++i)
        if (ctx.results[0].indices[i].health != "green") return true`,
    },
  },
  CAT_PENDING_TASKS: {
    type: 'CAT_PENDING_TASKS',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-pending-tasks/',
    exampleText: undefined,
    label: 'List pending tasks',
    paths: {
      withPathParams: undefined,
      withoutPathParams: '_cat/pending_tasks',
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: 'ctx.results[0].tasks.size() >= 0',
    },
  },
  CAT_RECOVERY: {
    type: 'CAT_RECOVERY',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-recovery/',
    exampleText: 'index1,index2...',
    label: 'List index and shard recoveries',
    paths: {
      withPathParams: '_cat/recovery',
      withoutPathParams: '_cat/recovery',
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: 'ctx.results[0].INDEX_NAME.shards.length <= 0',
    },
  },
  CAT_SHARDS: {
    type: 'CAT_SHARDS',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-shards/',
    exampleText: 'index1,index2...',
    label: 'List shards',
    paths: {
      withPathParams: '_cat/shards',
      withoutPathParams: '_cat/shards',
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: `for (int i = 0; i < ctx.results[0].shards.size(); ++i)
        if (ctx.results[0].shards[i]["unassigned.for"] != null) return true`,
    },
  },
  CAT_SNAPSHOTS: {
    type: 'CAT_SNAPSHOTS',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-snapshots/',
    exampleText: 'repositoryName',
    label: 'List snapshots',
    paths: {
      withPathParams: '_cat/snapshots',
      withoutPathParams: undefined,
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: 'ctx.results[0].SNAPSHOT_ID.status == "FAILED"',
    },
  },
  CAT_TASKS: {
    type: 'CAT_TASKS',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-tasks/',
    exampleText: undefined,
    label: 'List tasks',
    paths: {
      withPathParams: undefined,
      withoutPathParams: '_cat/tasks',
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: 'ctx.results[0].tasks.length > 0',
    },
  },
};
