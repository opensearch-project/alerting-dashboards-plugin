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
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
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
