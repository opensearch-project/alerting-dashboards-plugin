/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
  } = queryString.parse(location.search);

  return {
    from: isNaN(parseInt(from, 10)) ? DEFAULT_QUERY_PARAMS.from : parseInt(from, 10),
    size: isNaN(parseInt(size, 10)) ? DEFAULT_QUERY_PARAMS.size : parseInt(size, 10),
    search,
    sortField,
    sortDirection,
    state,
  };
}
