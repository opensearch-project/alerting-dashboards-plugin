/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_DATA } from '../../../../src/plugins/data/common';

/**
 * Whether Explore's "Create monitor" action can build a monitor from a query. Its flyout creates a
 * PPL monitor on an OpenSearch cluster, so only PPL queries on index patterns or indexes of the
 * local cluster or an OpenSearch data source qualify. Explore also shows datasets, languages and
 * data sources other plugins add (for example PromQL on a Prometheus connection); a monitor can't
 * be built from those, so the action stays hidden for them.
 */

const SUPPORTED_DATASET_TYPES = [
  DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
  DEFAULT_DATA.SET_TYPES.INDEX,
] as string[];
const SUPPORTED_LANGUAGE = 'PPL';

// Monitors run on OpenSearch: the local cluster, or a data source whose engine is OpenSearch.
// Data sources whose engine detection failed at creation report `No Engine Type Available`; they
// had the action before this check, so they keep it.
const LOCAL_CLUSTER = '';
const OPENSEARCH = 'OpenSearch';
const SUPPORTED_ENGINES = [LOCAL_CLUSTER, OPENSEARCH, 'No Engine Type Available'];

interface DataSourceLike {
  id?: string;
  type?: string;
  engineType?: string;
}

export interface ExploreQueryLike {
  language?: string;
  dataset?: { type?: string; dataSource?: DataSourceLike };
}

/**
 * The engine a dataset runs on. Index patterns on the local cluster have no data source, and
 * indexes on it get `{ id: '', type: 'DATA_SOURCE' }`: both are the local cluster. Otherwise it is
 * `engineType` (set on indexes), else `type` (the engine, on index patterns). An index on a data
 * source saved before engine detection has `type: 'DATA_SOURCE'` and no `engineType`; it counts as
 * OpenSearch, the same default index patterns get for a missing engine.
 */
const engineOf = (dataSource?: DataSourceLike): string => {
  if (!dataSource || !dataSource.id) return LOCAL_CLUSTER;
  if (dataSource.engineType) return dataSource.engineType;
  if (!dataSource.type || dataSource.type === 'DATA_SOURCE') return OPENSEARCH;
  return dataSource.type;
};

export const isExploreQueryMonitorable = (query?: ExploreQueryLike): boolean => {
  const dataset = query?.dataset;
  if (!dataset?.type || !SUPPORTED_DATASET_TYPES.includes(dataset.type)) return false;
  if (query?.language?.toUpperCase() !== SUPPORTED_LANGUAGE) return false;
  return SUPPORTED_ENGINES.includes(engineOf(dataset.dataSource));
};
