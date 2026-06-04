/// <reference types="jest" />
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shouldRegisterAlertingExploreAction } from './should_register_alerting_explore_action';

describe('shouldRegisterAlertingExploreAction', () => {
  // A truthy stand-in for Explore's setup contract. The predicate only
  // checks for presence, so the value's shape doesn't matter.
  const explore = { queryPanelActionsRegistry: {} };

  it('does not register when Explore is absent', () => {
    // Nothing to register against — the action lives on Explore's
    // queryPanelActionsRegistry.
    expect(shouldRegisterAlertingExploreAction({})).toBe(false);
  });

  it('does not register when Explore is absent even if observability is present', () => {
    expect(
      shouldRegisterAlertingExploreAction({
        observabilityDashboards: { ownsMonitorCreation: false },
      })
    ).toBe(false);
    expect(
      shouldRegisterAlertingExploreAction({
        observabilityDashboards: { ownsMonitorCreation: true },
      })
    ).toBe(false);
  });

  it('registers when Explore is present and observability is absent', () => {
    // Status quo for clusters that don't run dashboards-observability.
    expect(shouldRegisterAlertingExploreAction({ explore })).toBe(true);
  });

  it('registers when observability is loaded but did not claim monitor creation', () => {
    // observability ships with `alertManager.enabled: false` — the plugin
    // is loaded but its alert-manager surface is intentionally quiet, so
    // alerting takes ownership of "Create monitor".
    expect(
      shouldRegisterAlertingExploreAction({
        explore,
        observabilityDashboards: { ownsMonitorCreation: false },
      })
    ).toBe(true);
  });

  it('defers when observability has claimed monitor creation', () => {
    // Both plugins loaded, observability has `alertManager.enabled: true`
    // and reports `ownsMonitorCreation: true`. Alerting must NOT register
    // its action — otherwise the user sees two duplicate "Create monitor"
    // entries on the Logs page Actions menu.
    expect(
      shouldRegisterAlertingExploreAction({
        explore,
        observabilityDashboards: { ownsMonitorCreation: true },
      })
    ).toBe(false);
  });

  it('treats a missing ownsMonitorCreation field as "not claimed"', () => {
    // Defensive: an older observability build that predates the contract
    // exposes its setup object without the field. `?.` coalesces to
    // undefined, `!!` coerces to false, and alerting registers as before.
    // This is the backwards-compatibility case called out in the PR
    // description.
    expect(
      shouldRegisterAlertingExploreAction({
        explore,
        observabilityDashboards: ({} as unknown) as { ownsMonitorCreation: boolean },
      })
    ).toBe(true);
  });
});
