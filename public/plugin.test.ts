/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../src/core/public/mocks';
import { AlertingPlugin } from './plugin';

jest.mock('@osd/monaco', () => ({
  monaco: {
    languages: {
      CompletionItemKind: { Function: 1, Field: 4, Module: 6, Operator: 12, Keyword: 14 },
      CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
      registerCompletionItemProvider: jest.fn(),
    },
    editor: { create: jest.fn(), defineTheme: jest.fn() },
    Range: jest.fn(),
  },
}));

// Mock dynamic imports used in mount functions so they don't try to
// pull in real React app code during plugin.setup().
jest.mock('./app', () => ({
  renderApp: jest.fn(() => jest.fn()),
}));

describe('AlertingPlugin Explore "Create monitor" coordination', () => {
  /**
   * Build a setup-deps bag that includes a mock `explore` plugin with a
   * jest-spied `queryPanelActionsRegistry.register`. The `register` mock
   * is what we assert against — registration is deferred behind
   * `getStartServices()`, so tests await a flush before checking it.
   */
  function buildSetupDeps() {
    const register = jest.fn();
    return {
      register,
      deps: {
        expressions: { registerFunction: jest.fn() },
        uiActions: { addTriggerAction: jest.fn(), registerTrigger: jest.fn() },
        dataSourceManagement: {},
        dataSource: {},
        explore: {
          queryPanelActionsRegistry: { register },
        },
      } as any,
    };
  }

  /**
   * Override `coreSetup.getStartServices()` so tests can control the
   * capability bag the deferred registration sees. Pass `'reject'` to
   * force the catch branch.
   */
  function withCapabilities(
    coreSetup: ReturnType<typeof coreMock.createSetup>,
    observability: { alertManagerEnabled?: boolean } | undefined,
    behavior: 'resolve' | 'reject' = 'resolve'
  ) {
    if (behavior === 'reject') {
      (coreSetup.getStartServices as jest.Mock).mockRejectedValue(new Error('start failed'));
      return;
    }
    // Build a coreStart-shaped value where `application.capabilities`
    // contains the observability slice the test wants. The default
    // `coreMock.createStart()` returns deep-frozen capabilities, so we
    // construct a fresh shape rather than mutating the frozen one.
    const fakeCoreStart = {
      application: {
        capabilities: { observability },
      },
    };
    (coreSetup.getStartServices as jest.Mock).mockResolvedValue([fakeCoreStart, {}, {}]);
  }

  /** Yield to the microtask queue so the deferred `.then()` fires. */
  async function flushMicrotasks() {
    // Two awaits: one to flush the resolved getStartServices promise,
    // one to let the .then callback run synchronously after that.
    await Promise.resolve();
    await Promise.resolve();
  }

  let coreSetup: ReturnType<typeof coreMock.createSetup>;

  beforeEach(() => {
    coreSetup = coreMock.createSetup();
    coreSetup.chrome.navGroup.getNavGroupEnabled.mockReturnValue(true);
    if (!coreSetup.chrome.getIsIconSideNavEnabled) {
      coreSetup.chrome.getIsIconSideNavEnabled = jest.fn();
    }
  });

  it('does NOT register when capabilities.observability.alertManagerEnabled is true', async () => {
    const { register, deps } = buildSetupDeps();
    withCapabilities(coreSetup, { alertManagerEnabled: true });

    new AlertingPlugin().setup(coreSetup, deps);
    await flushMicrotasks();

    const exploreRegistration = register.mock.calls.find(
      (call) => call[0]?.id === 'alerting-create-monitor-from-explore'
    );
    expect(exploreRegistration).toBeUndefined();
  });

  it('DOES register when capabilities.observability.alertManagerEnabled is false', async () => {
    const { register, deps } = buildSetupDeps();
    withCapabilities(coreSetup, { alertManagerEnabled: false });

    new AlertingPlugin().setup(coreSetup, deps);
    await flushMicrotasks();

    const exploreRegistration = register.mock.calls.find(
      (call) => call[0]?.id === 'alerting-create-monitor-from-explore'
    );
    expect(exploreRegistration).toBeDefined();
  });

  it('DOES register when observability capability is absent (observability not installed)', async () => {
    const { register, deps } = buildSetupDeps();
    // Capability bag has no `observability` key — mirrors a host where
    // dashboards-observability isn't loaded.
    withCapabilities(coreSetup, undefined);

    new AlertingPlugin().setup(coreSetup, deps);
    await flushMicrotasks();

    const exploreRegistration = register.mock.calls.find(
      (call) => call[0]?.id === 'alerting-create-monitor-from-explore'
    );
    expect(exploreRegistration).toBeDefined();
  });

  it('does NOT throw and does NOT register when getStartServices() rejects', async () => {
    const { register, deps } = buildSetupDeps();
    withCapabilities(coreSetup, undefined, 'reject');

    expect(() => new AlertingPlugin().setup(coreSetup, deps)).not.toThrow();
    await flushMicrotasks();

    const exploreRegistration = register.mock.calls.find(
      (call) => call[0]?.id === 'alerting-create-monitor-from-explore'
    );
    expect(exploreRegistration).toBeUndefined();
    // The global setup.jest.js spy on console.error captures the
    // error surfaced by our `.catch()` handler.
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to register Explore'),
      expect.any(Error)
    );
  });

  it('does NOT register when explore plugin is absent', async () => {
    const { register, deps } = buildSetupDeps();
    withCapabilities(coreSetup, { alertManagerEnabled: false });
    delete deps.explore;

    new AlertingPlugin().setup(coreSetup, deps);
    await flushMicrotasks();

    expect(register).not.toHaveBeenCalled();
  });
});
