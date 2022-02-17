/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// https://github.com/elastic/eui/issues/2530
jest.mock('@elastic/eui/lib/components/icon', () => ({
  EuiIcon: () => <div>EuiIconMock</div>,
  __esModule: true,
  IconPropType: require('@elastic/eui/lib/components/icon/icon').IconPropType,
  ICON_TYPES: require('@elastic/eui/lib/components/icon/icon').TYPES,
  ICON_SIZES: require('@elastic/eui/lib/components/icon/icon').SIZES,
  ICON_COLORS: require('@elastic/eui/lib/components/icon/icon').COLORS,
}));

jest.mock('@elastic/eui/lib/components/form/form_row/make_id', () => () => 'some_make_id');

jest.mock('@elastic/eui/lib/services/accessibility', () => ({
  htmlIdGenerator: () => () => 'generated-id',
  cascadingMenuKeys: require('@elastic/eui/lib/services/accessibility/cascading_menu_keys'),
  comboBoxKeys: require('@elastic/eui/lib/services/accessibility/combo_box_keys'),
  accessibleClickKeys: require('@elastic/eui/lib/services/accessibility/accessible_click_keys'),
}));

// https://github.com/facebook/jest/issues/5785
// https://github.com/facebook/jest/pull/5267#issuecomment-356605468
beforeEach(() => {
  jest.spyOn(console, 'error');
  console.error.mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});
