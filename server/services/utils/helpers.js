/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get, map, mapKeys, mapValues, isPlainObject, snakeCase, camelCase } from 'lodash';

export function mapKeysDeep(obj, fn) {
  if (Array.isArray(obj)) {
    return map(obj, (innerObj) => mapKeysDeep(innerObj, fn));
  } else {
    return isPlainObject(obj)
      ? mapValues(mapKeys(obj, fn), (value) => mapKeysDeep(value, fn))
      : obj;
  }
}

export const toSnake = (value, key) => snakeCase(key);

export const toCamel = (value, key) => camelCase(key);

export const isIndexNotFoundError = (err) => {
  return (
    err.statusCode === 404 &&
    get(err, 'body.error.reason', '') ===
      'Configured indices are not found: [.opendistro-alerting-config]'
  );
};
