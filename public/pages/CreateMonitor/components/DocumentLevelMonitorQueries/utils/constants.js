/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OPERATORS_MAP } from '../../MonitorExpressions/expressions/utils/constants';

export const DOC_LEVEL_INPUT_FIELD = 'doc_level_input';

/**
 * A list of the operators currently supported for defining queries through the UI.
 */
export const SUPPORTED_DOC_LEVEL_QUERY_OPERATORS = [
  OPERATORS_MAP.IS.value,
  OPERATORS_MAP.IS_NOT.value,
  OPERATORS_MAP.IS_GREATER.value,
  OPERATORS_MAP.IS_GREATER_EQUAL.value,
  OPERATORS_MAP.IS_LESS.value,
  OPERATORS_MAP.IS_LESS_EQUAL.value,
];

/**
 * Initial implementation of document level monitors used these feature-specific operator values.
 * Refactored document level monitors assets to reuse the OPERATORS_MAP to reduce duplicate code
 * as new query types become supported.
 */
export const LEGACY_QUERY_OPERATORS = {
  IS: { text: 'is', value: '==' },
  IS_NOT: { text: 'is not', value: '!=' },
};

/**
 * These patterns delineate the field being queries from the query value
 * when using query string query syntax.
 */
export const QUERY_STRING_QUERY_OPERATORS = {
  [OPERATORS_MAP.IS_GREATER.value]: ':>',
  [OPERATORS_MAP.IS_GREATER_EQUAL.value]: ':>=',
  [OPERATORS_MAP.IS_LESS.value]: ':<',
  [OPERATORS_MAP.IS_LESS_EQUAL.value]: ':<=',
};

/**
 * Similar to OPERATORS_QUERY_MAP, this const contains the query patterns
 * for the SUPPORTED_DOC_LEVEL_QUERY_OPERATORS.
 */
export const DOC_LEVEL_QUERY_MAP = {
  [LEGACY_QUERY_OPERATORS.IS.value]: {
    query: ({ field, query }) => `${field}:\"${query}\"`,
  },
  [LEGACY_QUERY_OPERATORS.IS_NOT.value]: {
    query: ({ field, query }) => `NOT (${field}:\"${query}\")`,
  },
  [OPERATORS_MAP.IS.value]: {
    query: ({ field, query }) => `${field}:\"${query}\"`,
  },
  [OPERATORS_MAP.IS_NOT.value]: {
    query: ({ field, query }) => `NOT (${field}:\"${query}\")`,
  },
  [OPERATORS_MAP.IS_GREATER.value]: {
    query: ({ field, query }) =>
      `${field}${QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_GREATER.value]}${query}`,
  },
  [OPERATORS_MAP.IS_GREATER_EQUAL.value]: {
    query: ({ field, query }) =>
      `${field}${QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_GREATER_EQUAL.value]}${query}`,
  },
  [OPERATORS_MAP.IS_LESS.value]: {
    query: ({ field, query }) =>
      `${field}${QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_LESS.value]}${query}`,
  },
  [OPERATORS_MAP.IS_LESS_EQUAL.value]: {
    query: ({ field, query }) =>
      `${field}${QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_LESS_EQUAL.value]}${query}`,
  },
};
