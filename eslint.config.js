/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');
const { includeIgnoreFile } = require('@eslint/compat');
const osdConfig = require('@elastic/eslint-config-kibana');
const { eui } = require('@elastic/eslint-config-kibana/extras');

module.exports = [
  // Previously the lint command used `--ignore-path .gitignore`. ESLint 10 flat
  // config no longer supports `--ignore-path` nor reads `.gitignore`, so mirror
  // that behavior by importing the .gitignore patterns as ignores. This keeps
  // the ignore list in sync with .gitignore instead of duplicating it here.
  includeIgnoreFile(path.resolve(__dirname, '.gitignore')),
  ...osdConfig,
  ...eui,
  {
    rules: {
      '@osd/eslint/require-license-header': 'off',
    },
  },
];
