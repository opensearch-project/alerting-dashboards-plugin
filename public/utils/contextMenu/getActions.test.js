/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getActions } from './getActions';

describe('getActions', () => {
  test('actions', () => {
    const actions = getActions({});
    expect(actions.length).toEqual(3);
  });
});
