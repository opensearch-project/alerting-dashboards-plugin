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
  setupFilesAfterEnv: ['<rootDir>/test/setup.jest.js'],
  modulePaths: ['node_modules', `../../node_modules`],
  coverageDirectory: './coverage',
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/test/mocks/styleMock.js',
    '^ui/(.*)': '<rootDir>/../../src/legacy/ui/public/$1/',
  },
  snapshotSerializers: ['../../node_modules/enzyme-to-json/serializer'],
  coverageReporters: ['lcov', 'text', 'cobertura'],
  testMatch: ['**/*.test.js'],
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
  transformIgnorePatterns: [
    // ignore all node_modules except d3-color which requires babel transforms to handle export statement
    // since ESM modules are not natively supported in Jest yet (https://github.com/facebook/jest/issues/4842)
    '[/\\\\]node_modules(?![\\/\\\\](d3-color))[/\\\\].+\\.js$',
  ],
};
