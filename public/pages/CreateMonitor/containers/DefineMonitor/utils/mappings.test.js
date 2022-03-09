/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPathsPerDataType } from './mappings';

describe('getPathsPerDataType', () => {
  test('returns correct dataTypes', () => {
    const mappings = {
      random_index: {
        mappings: {
          properties: {
            '@message': { type: 'text' },
            '@timestamp': { type: 'date' },
            username: { type: 'keyword' },
            memory: { type: 'double' },
            phpmemory: { type: 'long' },
            bytes: { type: 'long' },
            clientip: { type: 'ip' },
            id: { type: 'integer' },
            ip: { type: 'ip' },
          },
        },
      },
    };
    expect(getPathsPerDataType(mappings)).toEqual({
      text: new Set(['@message']),
      date: new Set(['@timestamp']),
      keyword: new Set(['username']),
      double: new Set(['memory']),
      long: new Set(['phpmemory', 'bytes']),
      ip: new Set(['clientip', 'ip']),
      integer: new Set(['id']),
    });
  });
});
