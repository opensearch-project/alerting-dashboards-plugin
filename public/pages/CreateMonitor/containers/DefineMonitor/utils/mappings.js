/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function shouldSkip(mapping) {
  const isDisabled = mapping.enabled === false;
  const hasIndexDisabled = mapping.index === false;
  const isNestedDataType = mapping.type === 'nested';
  return isDisabled || hasIndexDisabled || isNestedDataType;
}

export function resolvePath(path, field) {
  if (path) return `${path}.${field}`;
  return field;
}

export function getFieldsFromProperties(properties, dataTypes, path) {
  Object.entries(properties).forEach(([field, value]) => {
    getTypeFromMappings(value, dataTypes, resolvePath(path, field));
  });
}

export function getTypeFromMappings(mappings, dataTypes, path = '') {
  // Example structures of index mappings:
  // properties: { "field_name":{"properties": ...} }
  // properties: { "field_name":{"type": "text"} }
  if (shouldSkip(mappings)) return dataTypes;
  // if there are properties then type is inherently an object
  if (mappings.properties) {
    getFieldsFromProperties(mappings.properties, dataTypes, path);
    return dataTypes;
  }

  const type = mappings.type;

  if (dataTypes[type]) dataTypes[type].add(path);
  else dataTypes[type] = new Set([path]);
  return dataTypes;
}

export function getPathsPerDataType(mappings) {
  const dataTypes = {};
  Object.entries(mappings).forEach(([index, { mappings: docMappings }]) =>
    getTypeFromMappings(docMappings, dataTypes)
  );
  return dataTypes;
}
