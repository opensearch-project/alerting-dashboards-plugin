/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export default function ({ loadTestFile }) {
  describe('app plugins', () => {
    loadTestFile(require.resolve('./alerting-app.js'));
  });
}
