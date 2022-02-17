/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getURLQueryParams } from '../helpers';

describe('Helpers', () => {
  describe('getURLQueryParams', () => {
    test('should return valid default query params', () => {
      expect(getURLQueryParams({ search: '' })).toMatchSnapshot();
    });
    test('should return query string value if provided else default value', () => {
      expect(getURLQueryParams({ search: '?from=20&size=15' })).toMatchSnapshot();
    });
  });
});
