/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MONITOR_TYPE } from '../../../../../utils/constants';
import { DEFAULT_QUERY_PARAMS } from './constants';
import queryString from 'query-string';

export function getURLQueryParams(location) {
  const {
    from = DEFAULT_QUERY_PARAMS.from,
    size = DEFAULT_QUERY_PARAMS.size,
    search = DEFAULT_QUERY_PARAMS.search,
    sortField = DEFAULT_QUERY_PARAMS.sortField,
    sortDirection = DEFAULT_QUERY_PARAMS.sortDirection,
    state = DEFAULT_QUERY_PARAMS.state,
    dataSourceId,
  } = queryString.parse(location.search);

  return {
    from: isNaN(parseInt(from, 10)) ? DEFAULT_QUERY_PARAMS.from : parseInt(from, 10),
    size: isNaN(parseInt(size, 10)) ? DEFAULT_QUERY_PARAMS.size : parseInt(size, 10),
    search,
    sortField,
    sortDirection,
    state,
    dataSourceId: dataSourceId === undefined ? undefined : dataSourceId,
  };
}

export function getItemLevelType(itemType) {
  switch (itemType) {
    case MONITOR_TYPE.QUERY_LEVEL:
      return 'Per query';
    case MONITOR_TYPE.BUCKET_LEVEL:
      return 'Per bucket';
    case MONITOR_TYPE.CLUSTER_METRICS:
      return 'Per cluster metrics';
    case MONITOR_TYPE.DOC_LEVEL:
      return 'Per document';
    case MONITOR_TYPE.COMPOSITE_LEVEL:
      return 'Composite';
    default:
      return '-';
  }
}
