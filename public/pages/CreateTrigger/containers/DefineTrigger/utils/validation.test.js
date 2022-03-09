/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateTriggerName } from './validation';
import { TRIGGER_TYPE } from '../../CreateTrigger/utils/constants';

describe('validateTriggerName', () => {
  test('returns undefined if no error', () => {
    expect(validateTriggerName([], {})('valid trigger name')).toBeUndefined();
  });

  test('returns Required string if falsy value', () => {
    expect(validateTriggerName([], {})()).toBe('Required.');
    expect(validateTriggerName([], {})('')).toBe('Required.');
  });
  test('returns false if name already exists in monitor while creates new trigger', () => {
    const triggers = [{ [TRIGGER_TYPE.QUERY_LEVEL]: { id: '123', name: 'Test' } }];
    expect(validateTriggerName(triggers, { [TRIGGER_TYPE.QUERY_LEVEL]: {} })('Test')).toBe(
      'Trigger name already used.'
    );
  });

  test('returns undefined if editing trigger and name is the same', () => {
    const triggers = [{ id: '123', name: 'Test' }];
    expect(
      validateTriggerName(triggers, { [TRIGGER_TYPE.QUERY_LEVEL]: { id: '123' } })('Test')
    ).toBeUndefined();
  });
});
