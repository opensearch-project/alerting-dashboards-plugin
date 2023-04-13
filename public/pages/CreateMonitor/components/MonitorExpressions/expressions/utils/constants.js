/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const POPOVER_STYLE = { zIndex: '200' };
export const EXPRESSION_STYLE = { padding: '20px', whiteSpace: 'nowrap' };
export const Expressions = {
  THRESHOLD: 'THRESHOLD',
  WHEN: 'WHEN',
  OF_FIELD: 'OF_FIELD',
  OVER: 'OVER',
  FOR_THE_LAST: 'FOR_THE_LAST',
  WHERE: 'WHERE',
  METRICS: 'METRICS',
  GROUP_BY: 'GROUP_BY',
};
export const NUMBER_TYPES = [
  'long',
  'integer',
  'short',
  'byte',
  'double',
  'float',
  'half_float',
  'scaled_float',
];
export const UNITS_OF_TIME = [
  { value: 'm', text: 'minute(s)' },
  { value: 'h', text: 'hour(s)' },
  { value: 'd', text: 'day(s)' },
];

export const WHERE_BOOLEAN_FILTERS = [
  { text: 'Select value', value: '' },
  { text: 'True', value: true },
  { text: 'False', value: false },
];

export const OPERATORS_MAP = {
  IS: {
    text: 'is',
    value: 'is',
    dataTypes: ['number', 'text', 'keyword', 'boolean'],
  },
  IS_NOT: {
    text: 'is not',
    value: 'is_not',
    dataTypes: ['number', 'text', 'keyword', 'boolean'],
  },
  IS_NULL: {
    text: 'is null',
    value: 'is_null',
    dataTypes: ['number', 'text', 'keyword', 'boolean'],
  },
  IS_NOT_NULL: {
    text: 'is not null',
    value: 'is_not_null',
    dataTypes: ['number', 'text', 'keyword'],
  },
  IS_GREATER: {
    text: 'is greater than',
    value: 'is_greater',
    dataTypes: ['number'],
  },
  IS_GREATER_EQUAL: {
    text: 'is greater than equal',
    value: 'is_greater_equal',
    dataTypes: ['number'],
  },
  IS_LESS: {
    text: 'is less than',
    value: 'is_less',
    dataTypes: ['number'],
  },
  IS_LESS_EQUAL: {
    text: 'is less than equal',
    value: 'is_less_equal',
    dataTypes: ['number'],
  },
  STARTS_WITH: {
    text: 'starts with',
    value: 'starts_with',
    dataTypes: ['text', 'keyword'],
  },
  ENDS_WITH: {
    text: 'ends with',
    value: 'ends_with',
    dataTypes: ['text', 'keyword'],
  },
  CONTAINS: {
    text: 'contains',
    value: 'contains',
    dataTypes: ['text', 'keyword'],
  },
  DOES_NOT_CONTAINS: {
    text: 'does not contain',
    value: 'does_not_contains',
    dataTypes: ['text'],
  },
  IN_RANGE: {
    text: 'is in range',
    value: 'in_range',
    dataTypes: ['number'],
  },
  NOT_IN_RANGE: {
    text: 'is not in range',
    value: 'not_in_range',
    dataTypes: ['number'],
  },
};

export const OVER_TYPES = [{ value: 'all documents', text: 'all documents' }];

export const AGGREGATION_TYPES = [
  { value: 'avg', text: 'average()' },
  { value: 'count', text: 'count()' },
  { value: 'sum', text: 'sum()' },
  { value: 'min', text: 'min()' },
  { value: 'max', text: 'max()' },
];

export const GROUP_BY_ERROR = 'Must specify at least 1 group by expression.';
export const QUERY_TYPE_GROUP_BY_ERROR = 'Can have a maximum of 1 group by selections.';

export const QUERY_TYPE_METRIC_ERROR = 'Can have a maximum of 1 metric selections.';
export const WHERE_FILTER_ALLOWED_TYPES = ['number', 'text', 'keyword', 'boolean'];
