/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NUMBER_TYPES } from './constants';

export function getFieldsForType(dataTypes, type) {
  if (type === 'number') {
    return NUMBER_TYPES.reduce(
      (options, type) => options.concat(getFieldsForType(dataTypes, type)),
      []
    );
  }
  if (dataTypes[type]) {
    return [...dataTypes[type].values()];
  }
  return [];
}

export const getIndexFields = (dataTypes, allowedTypes) =>
  allowedTypes.map((type) => ({
    label: type,
    options: getFieldsForType(dataTypes, type).map((field) => ({ label: field, type })),
  }));

export const getFilteredIndexFields = (dataTypes, allowedTypes, fieldsToInclude) =>
  allowedTypes.map((type) => ({
    label: type,
    options: getFieldsForType(dataTypes, type)
      .filter((field) => fieldsToInclude.includes(field))
      .map((field) => ({ label: field, type })),
  }));
