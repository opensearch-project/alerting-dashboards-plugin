/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const chrome = {
  getUiSettingsClient: () => ({ get: () => false }),
};
module.exports = chrome;
