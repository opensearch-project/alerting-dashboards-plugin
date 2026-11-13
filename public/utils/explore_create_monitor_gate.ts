/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_DATA } from '../../../../src/plugins/data/common';

/**
 * Whether Explore's "Create monitor" action can build a monitor from a query. Its flyout creates a
 * PPL monitor on an OpenSearch engine, so only PPL queries on index patterns or indexes qualify,
 * on the local cluster or a data source that can host a PPL monitor. Explore also shows datasets,
 * languages and data sources other plugins add (for example PromQL on a Prometheus connection); a
 * monitor can't be built from those, so the action stays hidden for them.
 *
 * The Alerting app decides which data sources it lists with `dataSourceFilterFn` (saved object
 * attributes: version, installed plugins, the prefetched pluggable data format setting). An
 * Explore dataset carries only the engine type and a version, so this gate works from the engine
 * type. It doesn't check the version: the dataset's version is the one the data source saved
 * object recorded at registration, which isn't refreshed after an upgrade (the Alerting app
 * re-reads the live version for that reason), so it could hide the action on a cluster that can
 * run PPL monitors.
 */

const SUPPORTED_DATASET_TYPES: string[] = [
  DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
  DEFAULT_DATA.SET_TYPES.INDEX,
];
const SUPPORTED_LANGUAGE = 'PPL';

// The data source plugin's DataSourceEngineType values this gate accepts besides OpenSearch,
// written out so this file doesn't depend on that optional plugin: `NA` (engine detection failed
// at creation; those data sources had the action before this check, so they keep it) and
// `AnalyticEngine` (pluggable data format domains, which run PPL monitors).
const ENGINE_TYPE_NA = 'No Engine Type Available';
const ENGINE_TYPE_ANALYTIC_ENGINE = 'AnalyticEngine';

const LOCAL_CLUSTER = '';
const SUPPORTED_ENGINES: string[] = [
  LOCAL_CLUSTER,
  DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
  ENGINE_TYPE_NA,
  ENGINE_TYPE_ANALYTIC_ENGINE,
];

interface DataSourceLike {
  id?: string;
  type?: string;
  engineType?: string;
  /** Not used by the gate (see the header); kept so Explore's data source fits this type. */
  version?: string;
}

export interface ExploreQueryLike {
  language?: string;
  dataset?: { type?: string; dataSource?: DataSourceLike };
}

/**
 * The engine a dataset runs on. Index patterns on the local cluster have no data source, and
 * indexes on it get the local data source structure (`{ id: '', type: 'DATA_SOURCE' }`): both are
 * the local cluster. Otherwise it is `engineType` (set on indexes), else `type` (the engine, on
 * index patterns). An index on a data source saved before engine detection has `type:
 * 'DATA_SOURCE'` and no `engineType`; it counts as OpenSearch, the same default index patterns get
 * for a missing engine.
 */
const engineOf = (dataSource?: DataSourceLike): string => {
  if (!dataSource || !dataSource.id) return LOCAL_CLUSTER;
  if (dataSource.engineType) return dataSource.engineType;
  if (!dataSource.type || dataSource.type === DEFAULT_DATA.STRUCTURES.LOCAL_DATASOURCE.type) {
    return DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH;
  }
  return dataSource.type;
};

export const isExploreQueryMonitorable = (query?: ExploreQueryLike): boolean => {
  const dataset = query?.dataset;
  if (!dataset?.type || !SUPPORTED_DATASET_TYPES.includes(dataset.type)) return false;
  if (query?.language?.toUpperCase() !== SUPPORTED_LANGUAGE) return false;
  return SUPPORTED_ENGINES.includes(engineOf(dataset.dataSource));
};
