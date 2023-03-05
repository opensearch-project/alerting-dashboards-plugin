/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getActions } from './contextMenu';

describe('contextMenu', () => {
  test('actions', () => {
    const actions = getActions({});
    expect(actions.length).toEqual(3);
  });
});
