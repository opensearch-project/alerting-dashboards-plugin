/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { validateTimeField } from './validation';

describe('validation', () => {
  test('prompts user to select time field when no value is selected', () => {
    const dateFields = ['customer_birth_date', 'order_date', 'products.created_on'];
    const value = undefined;
    expect(validateTimeField(dateFields)(value)).toBe('Select a time field.');
  });

  test('shows error message if the option is not in dateFields', () => {
    const dateFields = ['customer_birth_date', 'order_date', 'products.created_on'];
    const value = 'invalidValue';
    expect(validateTimeField(dateFields)(value)).toBe(
      `The field "${value}" does not exist in the selected index mappings, please choose a new time field.`
    );
  });
});
