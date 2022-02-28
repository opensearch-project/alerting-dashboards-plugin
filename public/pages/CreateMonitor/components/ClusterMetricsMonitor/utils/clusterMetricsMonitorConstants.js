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

export const API_TYPES = {
  CLUSTER_HEALTH: {
    type: 'CLUSTER_HEALTH',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cluster-health/',
    exampleText: 'indexAlias1,indexAlias2...',
    label: 'Cluster Health',
    paths: {
      withPathParams: '_cluster/health/',
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
    label: 'Cluster Stats',
    paths: {
      withPathParams: '_cluster/stats/nodes/',
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
    label: 'Cluster Settings',
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
    label: 'Nodes Stats',
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
      source: 'ctx.results[0].nodes[0].jvm.mem.heap_used_percent > 60',
    },
  },
  CAT_PENDING_TASKS: {
    type: 'CAT_PENDING_TASKS',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-pending-tasks/',
    exampleText: undefined,
    label: 'CAT Pending Tasks',
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
      source: 'ctx.results[0].nodes[0].jvm.mem.heap_used_percent > 60',
    },
  },
  CAT_RECOVERY: {
    type: 'CAT_RECOVERY',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-recovery/',
    exampleText: 'index1,index2...',
    label: 'CAT Recovery',
    paths: {
      withPathParams: '_cat/recovery/',
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
  CAT_REPOSITORIES: {
    type: 'CAT_REPOSITORIES',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-repositories/',
    exampleText: undefined,
    label: 'CAT Repositories',
    paths: {
      withPathParams: undefined,
      withoutPathParams: '_cat/repositories',
    },
    get prependText() {
      return this.paths.withPathParams || this.paths.withoutPathParams;
    },
    appendText: '',
    defaultCondition: {
      ...DEFAULT_CLUSTER_METRICS_SCRIPT,
      source: 'ctx.results[0].REPOSITORY_NAME != null',
    },
  },
  CAT_SNAPSHOTS: {
    type: 'CAT_SNAPSHOTS',
    documentation: 'https://opensearch.org/docs/latest/opensearch/rest-api/cat/cat-snapshots/',
    exampleText: 'repositoryName',
    label: 'CAT Snapshots',
    paths: {
      withPathParams: '_cat/snapshots/',
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
    label: 'CAT Tasks',
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
