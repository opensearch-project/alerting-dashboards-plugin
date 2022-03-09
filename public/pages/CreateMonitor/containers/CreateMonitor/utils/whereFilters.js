/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OPERATORS_MAP } from '../../../components/MonitorExpressions/expressions/utils/constants';
import { DATA_TYPES } from '../../../../../utils/constants';

//TODO:: Breakdown to factory pattern for rules in-case we support multiple filters. This is just ease for the single one
export const OPERATORS_QUERY_MAP = {
  [OPERATORS_MAP.IS]: {
    query: ({ fieldName: [{ label, type }], fieldValue }) =>
      type === DATA_TYPES.TEXT
        ? { match_phrase: { [label]: fieldValue } }
        : { term: { [label]: fieldValue } },
  },
  [OPERATORS_MAP.IS_NOT]: {
    query: ({ fieldName: [{ label, type }], fieldValue }) =>
      type === DATA_TYPES.TEXT
        ? {
            bool: { must_not: { match_phrase: { [label]: fieldValue } } },
          }
        : {
            bool: { must_not: { term: { [label]: fieldValue } } },
          },
  },
  [OPERATORS_MAP.IS_NULL]: {
    query: ({ fieldName: [{ label: fieldKey }] }) => ({
      bool: { must_not: { exists: { field: fieldKey } } },
    }),
  },
  [OPERATORS_MAP.IS_NOT_NULL]: {
    query: ({ fieldName: [{ label: fieldKey }] }) => ({ exists: { field: fieldKey } }),
  },
  [OPERATORS_MAP.IS_GREATER]: {
    query: ({ fieldName: [{ label: fieldKey }], fieldValue }) => ({
      range: { [fieldKey]: { gt: fieldValue } },
    }),
  },

  [OPERATORS_MAP.IS_GREATER_EQUAL]: {
    query: ({ fieldName: [{ label: fieldKey }], fieldValue }) => ({
      range: { [fieldKey]: { gte: fieldValue } },
    }),
  },
  [OPERATORS_MAP.IS_LESS]: {
    query: ({ fieldName: [{ label: fieldKey }], fieldValue }) => ({
      range: { [fieldKey]: { lt: fieldValue } },
    }),
  },

  [OPERATORS_MAP.IS_LESS_EQUAL]: {
    query: ({ fieldName: [{ label: fieldKey }], fieldValue }) => ({
      range: { [fieldKey]: { lte: fieldValue } },
    }),
  },

  [OPERATORS_MAP.IN_RANGE]: {
    query: ({ fieldName: [{ label: fieldKey }], fieldRangeStart, fieldRangeEnd }) => ({
      range: { [fieldKey]: { gte: fieldRangeStart, lte: fieldRangeEnd } },
    }),
  },
  [OPERATORS_MAP.NOT_IN_RANGE]: {
    query: ({ fieldName: [{ label: fieldKey }], fieldRangeStart, fieldRangeEnd }) => ({
      bool: { must_not: { range: { [fieldKey]: { gte: fieldRangeStart, lte: fieldRangeEnd } } } },
    }),
  },

  [OPERATORS_MAP.STARTS_WITH]: {
    query: ({ fieldName: [{ label: fieldKey }], fieldValue }) => ({
      prefix: { [fieldKey]: fieldValue },
    }),
  },

  [OPERATORS_MAP.ENDS_WITH]: {
    query: ({ fieldName: [{ label: fieldKey }], fieldValue }) => ({
      wildcard: { [fieldKey]: `*${fieldValue}` },
    }),
  },
  [OPERATORS_MAP.CONTAINS]: {
    query: ({ fieldName: [{ label, type }], fieldValue }) =>
      type === DATA_TYPES.TEXT
        ? {
            query_string: { query: `*${fieldValue}*`, default_field: label },
          }
        : {
            wildcard: { [label]: `*${fieldValue}*` },
          },
  },
  [OPERATORS_MAP.NOT_CONTAINS]: {
    query: ({ fieldName: [{ label, type }], fieldValue }) =>
      type === DATA_TYPES.TEXT
        ? {
            bool: {
              must_not: { query_string: { query: `*${fieldValue}*`, default_field: label } },
            },
          }
        : {
            bool: { must_not: { wildcard: { [label]: `*${fieldValue}*` } } },
          },
  },
};
