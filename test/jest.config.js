/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  rootDir: '../',
  setupFiles: [
    '<rootDir>/test/polyfills.js',
    '<rootDir>/test/setupTests.js',
    '<rootDir>/test/enzyme.js',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.jest.js',
    '<rootDir>../../src/dev/jest/setup/monaco_mock.js',
  ],
  modulePaths: ['node_modules', `../../node_modules`],
  coverageDirectory: './coverage',
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/test/mocks/styleMock.js',
    '^ui/(.*)': '<rootDir>/../../src/legacy/ui/public/$1/',
    '^opensearch-dashboards/public$': '<rootDir>/../../src/core/public',
    '^!!raw-loader!.*': 'jest-raw-loader',
  },
  snapshotSerializers: ['../../node_modules/enzyme-to-json/serializer'],
  coverageReporters: ['lcov', 'text', 'cobertura'],
  testMatch: ['**/*.test.{js,ts}'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/index.js',
    '!<rootDir>/public/app.js',
    '!<rootDir>/public/actions/**',
    '!<rootDir>/public/components/Charts/Highlight/Highlight.js',
    '!<rootDir>/public/reducers/**',
    '!<rootDir>/public/store.js',
    '!<rootDir>/test/**',
    '!<rootDir>/server/**',
    '!<rootDir>/coverage/**',
    '!<rootDir>/scripts/**',
    '!<rootDir>/build/**',
    '!<rootDir>/gather-info.js',
    '!<rootDir>/cypress/**',
    '!**/vendor/**',
  ],
  clearMocks: true,
  testPathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
  modulePathIgnorePatterns: ['alertingDashboards'],
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
    '^.+\\.svg$': '<rootDir>/test/utils/mockTransform.js',
    '^.+\\.html$': '<rootDir>/test/utils/mockTransform.js',
  },
  transformIgnorePatterns: [
    // ignore all node_modules except d3-color which requires babel transforms to handle export statement
    // since ESM modules are not natively supported in Jest yet (https://github.com/facebook/jest/issues/4842)
    '[/\\\\]node_modules(?![\\/\\\\](monaco-editor|react-monaco-editor|weak-lru-cache|ordered-binary|d3-color|axios))[/\\\\].+\\.js$',
  ],
};
