/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { OPERATORS_MAP } from './constants';
import { TRIGGER_COMPARISON_OPERATORS } from '../../../../../CreateTrigger/containers/DefineBucketLevelTrigger/DefineBucketLevelTrigger';
import { DATA_TYPES } from '../../../../../../utils/constants';

export const DEFAULT_WHERE_EXPRESSION_TEXT = 'All fields are included';

export const getOperators = (
  fieldType = DATA_TYPES.TEXT,
  supportedOperators = Object.values(OPERATORS_MAP)
) =>
  supportedOperators.reduce(
    (acc, currentOperator) =>
      currentOperator.dataTypes.includes(fieldType)
        ? [...acc, { text: currentOperator.text, value: currentOperator.value }]
        : acc,
    []
  );

export const isRangeOperator = (selectedOperator) =>
  [OPERATORS_MAP.IN_RANGE.value, OPERATORS_MAP.NOT_IN_RANGE.value].includes(selectedOperator);
export const isNullOperator = (selectedOperator) =>
  [OPERATORS_MAP.IS_NULL.value, OPERATORS_MAP.IS_NOT_NULL.value].includes(selectedOperator);

export const displayText = (whereValues) => {
  const comparisonOperators = _.concat(Object.values(OPERATORS_MAP), TRIGGER_COMPARISON_OPERATORS);

  const whereFieldName = _.get(whereValues, 'fieldName[0].label', undefined);
  if (!whereFieldName) {
    return DEFAULT_WHERE_EXPRESSION_TEXT;
  }
  const selectedOperator = _.get(whereValues, 'operator', 'is');
  const operatorObj =
    comparisonOperators.find((operator) => operator.value === selectedOperator) || {};
  const initialText = `${whereFieldName} ${operatorObj.text || ''}`;

  if (isRangeOperator(selectedOperator)) {
    const startRange = _.get(whereValues, 'fieldRangeStart', 0);
    const endRange = _.get(whereValues, 'fieldRangeEnd', 0);
    return `${initialText} from ${startRange} to ${endRange}`;
  } else if (isNullOperator(selectedOperator)) {
    return `${initialText}`;
  } else {
    const value = _.get(whereValues, 'fieldValue', '');
    return `${initialText} ${value}`;
  }
};

export const validateRange = (value, whereFilters) => {
  if (value === '') return 'Required';
  if (whereFilters.fieldRangeEnd < value) {
    return 'Start should be less than end range';
  }
  if (value < whereFilters.fieldRangeStart) {
    return 'End should be greater than start range';
  }
};
