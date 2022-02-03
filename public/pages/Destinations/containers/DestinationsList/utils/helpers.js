/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import queryString from 'query-string';
import { DEFAULT_QUERY_PARAMS } from './constants';

export const getURLQueryParams = (location) => {
  const {
    from = DEFAULT_QUERY_PARAMS.from,
    size = DEFAULT_QUERY_PARAMS.size,
    search = DEFAULT_QUERY_PARAMS.search,
    sortField = DEFAULT_QUERY_PARAMS.sortField,
    sortDirection = DEFAULT_QUERY_PARAMS.sortDirection,
    type = DEFAULT_QUERY_PARAMS.type,
  } = queryString.parse(location.search);

  return {
    from: isNaN(parseInt(from, 10)) ? DEFAULT_QUERY_PARAMS.from : parseInt(from, 10),
    size: isNaN(parseInt(size, 10)) ? DEFAULT_QUERY_PARAMS.size : parseInt(size, 10),
    search,
    sortField,
    sortDirection,
    type,
  };
};
