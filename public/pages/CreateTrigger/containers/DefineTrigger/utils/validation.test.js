/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateTriggerName } from './validation';

describe('validateTriggerName', () => {
  test('returns undefined if no error', () => {
    expect(validateTriggerName([], 0)('valid trigger name')).toBeUndefined();
  });

  test('returns Required string if falsy value', () => {
    expect(validateTriggerName([], 0)('')).toBe('Trigger name is required.');
  });
  test('returns Required short version string if falsy value', () => {
    expect(validateTriggerName([], 0, true)('')).toBe('Required.');
  });
  test('returns undefined if editing trigger and name is the same', () => {
    const triggers = [{ name: 'Test' }];
    expect(validateTriggerName(triggers, 0)('Test')).toBeUndefined();
  });
  test('returns false if name already exists in monitor while creates new trigger', () => {
    const triggers = [{ name: 'Test' }];
    expect(validateTriggerName(triggers, 1)('Test')).toBe('Trigger name already used.');
  });
});
