/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validDocLevelGraphQueries } from './helpers';
import { SUPPORTED_DOC_LEVEL_QUERY_OPERATORS } from './constants';

describe('validDocLevelGraphQueries', () => {
  test('when no queries are supplied', () => {
    const queries = [];
    expect(validDocLevelGraphQueries(queries)).toEqual(false);
  });

  test('when a query does not have a queryName value', () => {
    const queries = [
      {
        id: 'query1',
        queryName: '',
        field: 'field.name',
        operator: SUPPORTED_DOC_LEVEL_QUERY_OPERATORS[0],
        query: 'value1',
        tags: ['tag1', 'tag2'],
      },
      {
        id: 'query2',
        queryName: 'query2',
        field: 'another.field.name',
        operator: SUPPORTED_DOC_LEVEL_QUERY_OPERATORS[0],
        query: 'value2',
        tags: ['tag3'],
      },
    ];
    expect(validDocLevelGraphQueries(queries)).toEqual(false);
  });

  test('when a query does not have a field value', () => {
    const queries = [
      {
        id: 'query1',
        queryName: 'query2',
        field: '',
        operator: SUPPORTED_DOC_LEVEL_QUERY_OPERATORS[0],
        query: 'value1',
        tags: ['tag1', 'tag2'],
      },
      {
        id: 'query2',
        queryName: 'query2',
        field: 'another.field.name',
        operator: SUPPORTED_DOC_LEVEL_QUERY_OPERATORS[0],
        query: 'value2',
        tags: ['tag3'],
      },
    ];
    expect(validDocLevelGraphQueries(queries)).toEqual(false);
  });

  test('when a query does not have an operator value', () => {
    const queries = [
      {
        id: 'query1',
        queryName: 'query2',
        field: 'field.name',
        operator: '',
        query: 'value1',
        tags: ['tag1', 'tag2'],
      },
      {
        id: 'query2',
        queryName: 'query2',
        field: 'another.field.name',
        operator: SUPPORTED_DOC_LEVEL_QUERY_OPERATORS[0],
        query: 'value2',
        tags: ['tag3'],
      },
    ];
    expect(validDocLevelGraphQueries(queries)).toEqual(false);
  });

  test('when a query does not have a query value', () => {
    const queries = [
      {
        id: 'query1',
        queryName: 'query1',
        field: 'field.name',
        operator: SUPPORTED_DOC_LEVEL_QUERY_OPERATORS[0],
        query: '',
        tags: ['tag1', 'tag2'],
      },
      {
        id: 'query2',
        queryName: 'query2',
        field: 'another.field.name',
        operator: SUPPORTED_DOC_LEVEL_QUERY_OPERATORS[0],
        query: 'value2',
        tags: ['tag3'],
      },
    ];
    expect(validDocLevelGraphQueries(queries)).toEqual(false);
  });

  test('when all queries are defined', () => {
    const queries = [
      {
        id: 'query1',
        queryName: 'query2',
        field: 'field.name',
        operator: SUPPORTED_DOC_LEVEL_QUERY_OPERATORS[0],
        query: 'value1',
        tags: ['tag1', 'tag2'],
      },
      {
        id: 'query2',
        queryName: 'query2',
        field: 'another.field.name',
        operator: SUPPORTED_DOC_LEVEL_QUERY_OPERATORS[0],
        query: 'value2',
        tags: ['tag3'],
      },
    ];
    expect(validDocLevelGraphQueries(queries)).toEqual(true);
  });
});
