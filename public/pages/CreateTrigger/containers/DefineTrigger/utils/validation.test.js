/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
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
