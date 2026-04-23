/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../src/core/public/mocks';
import { DEFAULT_APP_CATEGORIES, DEFAULT_NAV_GROUPS } from '../../../src/core/public';
import { AlertingPlugin } from './plugin';

// Mock dynamic imports used in mount functions
jest.mock('./app', () => ({
  renderApp: jest.fn(() => jest.fn()),
}));

describe('AlertingPlugin nav registration', () => {
  let coreSetup: ReturnType<typeof coreMock.createSetup>;
  let plugin: AlertingPlugin;

  const mockSetupDeps = {
    expressions: { registerFunction: jest.fn() },
    uiActions: {
      addTriggerAction: jest.fn(),
      registerTrigger: jest.fn(),
    },
    dataSourceManagement: {},
    dataSource: {},
  } as any;

  beforeEach(() => {
    coreSetup = coreMock.createSetup();
    coreSetup.chrome.navGroup.getNavGroupEnabled.mockReturnValue(true);
    plugin = new AlertingPlugin();
  });

  it('should not register alerting in observability detect category when icon side nav ON', () => {
    (coreSetup.chrome.getIsIconSideNavEnabled as jest.Mock).mockReturnValue(true);

    plugin.setup(coreSetup, mockSetupDeps);

    const calls = (coreSetup.chrome.navGroup.addNavLinksToGroup as jest.Mock).mock.calls;

    // With icon side nav ON, alerting should NOT be added to observability with detect category
    const observabilityDetectCall = calls.find(
      (call: any) =>
        call[0] === DEFAULT_NAV_GROUPS.observability &&
        call[1].some(
          (link: any) =>
            link.id === 'alerting' && link.category === DEFAULT_APP_CATEGORIES.detect
        )
    );
    expect(observabilityDetectCall).toBeUndefined();

    // Instead, it should be registered with observabilityTools category and bell icon
    const observabilityToolsCall = calls.find(
      (call: any) =>
        call[0] === DEFAULT_NAV_GROUPS.observability &&
        call[1].some(
          (link: any) =>
            link.id === 'alerting' &&
            link.category === DEFAULT_APP_CATEGORIES.observabilityTools &&
            link.euiIconType === 'bell'
        )
    );
    expect(observabilityToolsCall).toBeDefined();
  });

  it('should register alerting in observability detect category when icon side nav OFF', () => {
    (coreSetup.chrome.getIsIconSideNavEnabled as jest.Mock).mockReturnValue(false);

    plugin.setup(coreSetup, mockSetupDeps);

    const calls = (coreSetup.chrome.navGroup.addNavLinksToGroup as jest.Mock).mock.calls;

    // With icon side nav OFF, alerting SHOULD be added to observability with detect category
    const observabilityDetectCall = calls.find(
      (call: any) =>
        call[0] === DEFAULT_NAV_GROUPS.observability &&
        call[1].some(
          (link: any) =>
            link.id === 'alerting' && link.category === DEFAULT_APP_CATEGORIES.detect
        )
    );
    expect(observabilityDetectCall).toBeDefined();
  });
});
