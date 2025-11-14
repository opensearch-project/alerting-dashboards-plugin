/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { get, map, mapKeys, mapValues, isPlainObject, snakeCase, camelCase } from 'lodash';
import { schema } from '@osd/config-schema';

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
  // Check for 404 status and index_not_found_exception type
  if (err.statusCode === 404) {
    const errorType = get(err, 'body.error.type', '');
    const errorReason = get(err, 'body.error.reason', '');
    
    // Match any index_not_found_exception or the legacy specific message
    return (
      errorType === 'index_not_found_exception' ||
      errorReason === 'Configured indices are not found: [.opendistro-alerting-config]' ||
      errorReason.includes('no such index')
    );
  }
  return false;
};

export function createValidateQuerySchema(dataSourceEnabled, fields = {}) {
  // Extend the query schema with the specified fields
  const schemaObj = { ...fields };

  if (dataSourceEnabled) {
    // Make dataSourceId optional - it's not always required (e.g., for PPL preview on local cluster)
    schemaObj['dataSourceId'] = schema.maybe(schema.string());
  }
  return schema.object(schemaObj);
}
