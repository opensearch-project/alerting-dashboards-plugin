/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { NUMBER_TYPES } from './constants';
import { DATA_TYPES } from '../../../../../../utils/constants';

export function getFieldsForType(dataTypes, type) {
  if (type === DATA_TYPES.NUMBER) {
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

/**
 * Searches the output from 'getIndexFields' for the provided field to determine the field's type.
 * @param queryField - a string representing the field being queried.
 * @param indexFields - the array output from 'getIndexFields'.
 * @return {*|string} - a string representing the data type of the queryField.
 */
export function getTypeForField(queryField = '', indexFields = []) {
  if (_.isEmpty(queryField) || _.isEmpty(indexFields)) return DATA_TYPES.TEXT;
  const match = indexFields.find(
    (entry) => entry.options?.find((dataField) => dataField.label === queryField) !== undefined
  );
  return match?.label || DATA_TYPES.TEXT;
}
