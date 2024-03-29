/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  displayText,
  isRangeOperator,
  isNullOperator,
  validateRange,
  getOperators,
} from './whereHelpers';
import { OPERATORS_MAP } from './constants';

describe('whereHelpers', () => {
  describe('getOperators', () => {
    test('should return all supported number operators', () => {
      expect(getOperators('number')).toEqual([
        {
          text: 'is',
          value: 'is',
        },
        {
          text: 'is not',
          value: 'is_not',
        },
        {
          text: 'is null',
          value: 'is_null',
        },
        {
          text: 'is not null',
          value: 'is_not_null',
        },
        {
          text: 'is greater than',
          value: 'is_greater',
        },
        {
          text: 'is greater than equal',
          value: 'is_greater_equal',
        },
        {
          text: 'is less than',
          value: 'is_less',
        },
        {
          text: 'is less than equal',
          value: 'is_less_equal',
        },
        {
          text: 'is in range',
          value: 'in_range',
        },
        {
          text: 'is not in range',
          value: 'not_in_range',
        },
      ]);
    });
    test('should return all supported text operators', () => {
      expect(getOperators('text')).toEqual([
        {
          text: 'is',
          value: 'is',
        },
        {
          text: 'is not',
          value: 'is_not',
        },
        {
          text: 'is null',
          value: 'is_null',
        },
        {
          text: 'is not null',
          value: 'is_not_null',
        },
        {
          text: 'starts with',
          value: 'starts_with',
        },
        {
          text: 'ends with',
          value: 'ends_with',
        },
        {
          text: 'contains',
          value: 'contains',
        },
        {
          text: 'does not contain',
          value: 'does_not_contains',
        },
      ]);
    });
    test('should return all supported keyword operators', () => {
      expect(getOperators('keyword')).toEqual([
        {
          text: 'is',
          value: 'is',
        },
        {
          text: 'is not',
          value: 'is_not',
        },
        {
          text: 'is null',
          value: 'is_null',
        },
        {
          text: 'is not null',
          value: 'is_not_null',
        },
        {
          text: 'starts with',
          value: 'starts_with',
        },
        {
          text: 'ends with',
          value: 'ends_with',
        },
        {
          text: 'contains',
          value: 'contains',
        },
      ]);
    });
    test('should return all supported boolean operators', () => {
      expect(getOperators('boolean')).toEqual([
        {
          text: 'is',
          value: 'is',
        },
        {
          text: 'is not',
          value: 'is_not',
        },
        {
          text: 'is null',
          value: 'is_null',
        },
      ]);
    });
  });
  describe('isRangeOperator', () => {
    test('should return true  for IN_RANGE operator', () => {
      expect(isRangeOperator(OPERATORS_MAP.IN_RANGE.value)).toBe(true);
    });
    test('should return true  for NOT_IN_RANGE operator', () => {
      expect(isRangeOperator(OPERATORS_MAP.NOT_IN_RANGE.value)).toBe(true);
    });
    test('should return false for any other operators', () => {
      expect(isRangeOperator(OPERATORS_MAP.IS.value)).toBe(false);
      expect(isRangeOperator(OPERATORS_MAP.IS_GREATER_EQUAL.value)).toBe(false);
    });
  });

  describe('isNullOperator', () => {
    test('should return true for IS_NULL operator', () => {
      expect(isNullOperator(OPERATORS_MAP.IS_NULL.value)).toBe(true);
    });
    test('should return true  for IS_NOT_NULL operator', () => {
      expect(isNullOperator(OPERATORS_MAP.IS_NOT_NULL.value)).toBe(true);
    });
    test('should return false for any other operators', () => {
      expect(isNullOperator(OPERATORS_MAP.IS.value)).toBe(false);
      expect(isNullOperator(OPERATORS_MAP.IS_GREATER_EQUAL.value)).toBe(false);
    });
  });

  describe('validateRange', () => {
    test('should return validation error invalid start range', () => {
      expect(validateRange(100, { fieldRangeStart: 100, fieldRangeEnd: 50 })).toBe(
        'Start should be less than end range.'
      );
    });

    test('should return validation error equal start and end range', () => {
      expect(validateRange(100, { fieldRangeStart: 100, fieldRangeEnd: 50 })).toBe(
        'Start should be less than end range.'
      );
    });

    test('should return validation error invalid end range', () => {
      expect(validateRange(200, { fieldRangeStart: 300, fieldRangeEnd: 200 })).toBe(
        'End should be greater than start range.'
      );
    });

    test('should return Required for empty values', () => {
      expect(validateRange('', { fieldRangeStart: '', fieldRangeEnd: 200 })).toBe('Required.');
    });

    test('should return Required for undefined values', () => {
      expect(validateRange(undefined, { fieldRangeStart: '', fieldRangeEnd: 200 })).toBe(
        'Required.'
      );
    });

    test('should return Required for null values', () => {
      expect(validateRange(null, { fieldRangeStart: '', fieldRangeEnd: 200 })).toBe('Required.');
    });

    test('should return undefined for valid range', () => {
      expect(validateRange(100, { fieldRangeStart: 100, fieldRangeEnd: 200 })).toBe(undefined);
    });
  });

  describe('displayText', () => {
    test('should return between and text for range operator', () => {
      expect(
        displayText({
          fieldName: [{ label: 'age', type: 'number' }],
          operator: OPERATORS_MAP.IN_RANGE.value,
          fieldRangeStart: 20,
          fieldRangeEnd: 40,
        })
      ).toBe('age is in range from 20 to 40');
    });
    test('should return between and text for not in range operator', () => {
      expect(
        displayText({
          fieldName: [{ label: 'age', type: 'number' }],
          operator: OPERATORS_MAP.NOT_IN_RANGE.value,
          fieldRangeStart: 20,
          fieldRangeEnd: 40,
        })
      ).toBe('age is not in range from 20 to 40');
    });
    test('should return text for null operators', () => {
      expect(
        displayText({
          fieldName: [{ label: 'age', type: 'number' }],
          operator: OPERATORS_MAP.IS_NULL.value,
        })
      ).toBe('age is null');
    });
    test('should return text for not null operators', () => {
      expect(
        displayText({
          fieldName: [{ label: 'age', type: 'number' }],
          operator: OPERATORS_MAP.IS_NOT_NULL.value,
        })
      ).toBe('age is not null');
    });
    test('should return text based on operator', () => {
      expect(
        displayText({
          fieldName: [{ label: 'age', type: 'number' }],
          operator: OPERATORS_MAP.IS_GREATER.value,
          fieldValue: 20,
        })
      ).toBe('age is greater than 20');
    });
  });
});
