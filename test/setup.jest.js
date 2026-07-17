/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// https://github.com/elastic/eui/issues/2530
jest.mock('@elastic/eui/lib/eui_components/icon', () => ({
  EuiIcon: () => <div>EuiIconMock</div>,
  __esModule: true,
  IconPropType: require('@elastic/eui/lib/eui_components/icon/icon').IconPropType,
  ICON_TYPES: require('@elastic/eui/lib/eui_components/icon/icon').TYPES,
  ICON_SIZES: require('@elastic/eui/lib/eui_components/icon/icon').SIZES,
  ICON_COLORS: require('@elastic/eui/lib/eui_components/icon/icon').COLORS,
}));

jest.mock('@elastic/eui/lib/components/form/form_row/make_id', () => () => 'some_make_id');

jest.mock('@elastic/eui/lib/services/accessibility', () => ({
  htmlIdGenerator: () => () => 'generated-id',
  cascadingMenuKeys: require('@elastic/eui/lib/services/accessibility/cascading_menu_keys'),
  comboBoxKeys: require('@elastic/eui/lib/services/accessibility/combo_box_keys'),
  accessibleClickKeys: require('@elastic/eui/lib/services/accessibility/accessible_click_keys'),
}));

// jest-location-mock uses process.env.HOST as the base URL for its window.location mock.
// Set it to match testEnvironmentOptions.url so window.location.origin is 'http://localhost:5601'
// in all jsdom tests, consistent with the rest of the suite.
process.env.HOST = 'http://localhost:5601';

// Mock window.matchMedia for Monaco editor / EUI. Declared configurable so tests
// may override it without hitting "Cannot redefine property" under jsdom 26.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// jsdom 26 marks window.localStorage and window.sessionStorage as non-configurable.
// Re-declare them as configurable once here so individual tests can override them
// with Object.defineProperty without hitting "Cannot redefine property" errors.
['localStorage', 'sessionStorage'].forEach((key) => {
  const descriptor = Object.getOwnPropertyDescriptor(window, key);
  if (descriptor && !descriptor.configurable) {
    Object.defineProperty(window, key, {
      configurable: true,
      writable: true,
      value: descriptor.value,
    });
  }
});

// https://github.com/facebook/jest/issues/5785
// https://github.com/facebook/jest/pull/5267#issuecomment-356605468
beforeEach(() => {
  jest.spyOn(console, 'error');
  console.error.mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});
