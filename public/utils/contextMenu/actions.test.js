/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getActions } from './actions';

describe('getActions', () => {
  test('actions', () => {
    const actions = getActions({});
    expect(actions.length).toEqual(3);
  });
});
