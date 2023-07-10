/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { OPERATORS_MAP } from './constants';
import { TRIGGER_COMPARISON_OPERATORS } from '../../../../../CreateTrigger/containers/DefineBucketLevelTrigger/DefineBucketLevelTrigger';
import { DATA_TYPES } from '../../../../../../utils/constants';
import { FORMIK_INITIAL_WHERE_EXPRESSION_VALUES } from '../../../../containers/CreateMonitor/utils/constants';

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
  if (!whereFieldName) return DEFAULT_WHERE_EXPRESSION_TEXT;

  const selectedOperator = _.get(whereValues, 'operator', OPERATORS_MAP.IS);
  const operatorObj =
    comparisonOperators.find((operator) => operator.value === selectedOperator) || {};
  const initialText = `${whereFieldName} ${operatorObj.text || ''}`;

  if (isRangeOperator(selectedOperator)) {
    const startRange = _.get(whereValues, 'fieldRangeStart');
    const endRange = _.get(whereValues, 'fieldRangeEnd');
    return `${initialText} from ${startRange} to ${endRange}`;
  } else if (isNullOperator(selectedOperator)) {
    return `${initialText}`;
  } else {
    const value = _.get(whereValues, 'fieldValue', '');
    return `${initialText} ${value}`;
  }
};

export const validateRange = (value = '', filter = FORMIK_INITIAL_WHERE_EXPRESSION_VALUES) => {
  if (_.isEmpty(value?.toString())) return 'Required.';
  if (filter.fieldRangeEnd < value || filter.fieldRangeStart === filter.fieldRangeEnd)
    return 'Start should be less than end range.';
  if (value < filter.fieldRangeStart) return 'End should be greater than start range.';
  return undefined;
};

export const validateWhereFilter = (filter = FORMIK_INITIAL_WHERE_EXPRESSION_VALUES) => {
  const fieldName = _.get(
    filter,
    'fieldName[0]',
    FORMIK_INITIAL_WHERE_EXPRESSION_VALUES.fieldName[0]
  );
  const fieldOperator = _.get(filter, 'operator', FORMIK_INITIAL_WHERE_EXPRESSION_VALUES.operator);
  let filterIsValid = !_.isEmpty(fieldName.label);
  switch (fieldOperator) {
    case OPERATORS_MAP.IS.value:
    case OPERATORS_MAP.IS_NOT.value:
    case OPERATORS_MAP.IS_GREATER.value:
    case OPERATORS_MAP.IS_GREATER_EQUAL.value:
    case OPERATORS_MAP.IS_LESS.value:
    case OPERATORS_MAP.IS_LESS_EQUAL.value:
    case OPERATORS_MAP.STARTS_WITH.value:
    case OPERATORS_MAP.ENDS_WITH.value:
    case OPERATORS_MAP.CONTAINS.value:
    case OPERATORS_MAP.DOES_NOT_CONTAINS.value:
      // These operators store the query value in the 'fieldValue'
      // attribute of FORMIK_INITIAL_WHERE_EXPRESSION_VALUES.
      // Validate that value.
      filterIsValid = filterIsValid && !_.isEmpty(filter.fieldValue?.toString());
      break;
    case OPERATORS_MAP.IN_RANGE.value:
    case OPERATORS_MAP.NOT_IN_RANGE.value:
      // These operators store the query values in the 'fieldRangeStart' and 'fieldRangeEnd'
      // attributes of FORMIK_INITIAL_WHERE_EXPRESSION_VALUES.
      // Both of those values need to be validated.
      filterIsValid =
        filterIsValid &&
        !validateRange(filter.fieldRangeStart, filter) &&
        !validateRange(filter.fieldRangeEnd, filter);
      break;
    case OPERATORS_MAP.IS_NULL.value:
    case OPERATORS_MAP.IS_NOT_NULL.value:
      // These operators don't store a query value in the FORMIK_INITIAL_WHERE_EXPRESSION_VALUES.
      // No further validation needed.
      break;
    default:
      console.log('Unknown query operator detected:', fieldOperator);
      filterIsValid = false;
  }
  return filterIsValid;
};

export const validateWhereFilters = (filters = []) => {
  return filters.filter((filter) => validateWhereFilter(filter)).length === filters.length;
};
