/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { SUPPORTED_DOC_LEVEL_QUERY_OPERATORS } from './constants';
import { OPERATORS_MAP } from '../../MonitorExpressions/expressions/utils/constants';

/**
 * Returns an array of { text: string, value: string, dataTypes: string[] } objects.
 * Used by the DocumentLevelQuery.js to populate the operator options FormikSelect element.
 * @return {*[]}
 */
export const getDocLevelQueryOperators = () => {
  return SUPPORTED_DOC_LEVEL_QUERY_OPERATORS.map((type) => OPERATORS_MAP[_.toUpper(type)]);
};

/**
 * Validates whether the array of document level monitor queries can be executed.
 * @param queries - an array of FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES objects.
 * @return {boolean} - TRUE if all queries are valid; otherwise FALSE.
 */
export const validDocLevelGraphQueries = (queries = []) => {
  // The 'queryName', 'field', 'operator', and 'query' fields are required to execute a doc level query.
  // If any of those fields are undefined for any queries, the monitor cannot be executed.
  const incompleteQueries = queries.find(
    (query) =>
      _.isEmpty(query.queryName) ||
      _.isEmpty(query.field) ||
      _.isEmpty(query.operator) ||
      _.isEmpty(query.query?.toString())
  );
  return !_.isEmpty(queries) && _.isEmpty(incompleteQueries);
};
