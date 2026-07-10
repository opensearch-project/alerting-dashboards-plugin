/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const osdConfig = require('@elastic/eslint-config-kibana');
const { eui } = require('@elastic/eslint-config-kibana/extras');

module.exports = [
  ...osdConfig,
  ...eui,
  {
    rules: {
      '@osd/eslint/require-license-header': 'off',
    },
  },
];
