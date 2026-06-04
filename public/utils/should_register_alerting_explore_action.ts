/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Predicate for the alerting plugin's "Create monitor" entry on Explore's
 * Query Panel "Actions" menu.
 *
 * Pulled out of `plugin.tsx` so the gate's behavior can be unit-tested
 * without dragging in the rest of the plugin's setup-time imports
 * (React, EUI, embeddable, core, etc.). The runtime call site in
 * `plugin.tsx::setup()` reads exactly two pieces of `setupDeps`:
 *
 *   const isExploreEnabled = !!explore;
 *   const obsOwnsMonitorCreation = !!observabilityDashboards?.ownsMonitorCreation;
 *   if (isExploreEnabled && !obsOwnsMonitorCreation) { register(); }
 *
 * Behavior matrix:
 *
 * | explore | observability | ownsMonitorCreation | register? |
 * | ------- | ------------- | ------------------- | --------- |
 * | absent  | n/a           | n/a                 | no        |
 * | present | absent        | n/a                 | yes       |
 * | present | present       | false (or missing)  | yes       |
 * | present | present       | true                | no        |
 *
 * The "missing field" case lets older observability builds (predating the
 * `ownsMonitorCreation` contract from dashboards-observability #2712)
 * coexist — alerting registers as before since the flag is absent.
 */

/**
 * Structural shape of the slice of `dashboards-observability`'s setup
 * contract this plugin depends on. Inlined here (rather than imported
 * from the observability package) so this plugin builds cleanly when
 * observability isn't in the workspace.
 */
export interface ObservabilityDashboardsSetupShape {
  ownsMonitorCreation: boolean;
}

export interface AlertingExploreActionGateDeps {
  /** Truthy when Explore's setup contract is available. */
  explore?: unknown;
  /** Optional — present only when dashboards-observability is loaded. */
  observabilityDashboards?: ObservabilityDashboardsSetupShape;
}

export function shouldRegisterAlertingExploreAction(
  deps: AlertingExploreActionGateDeps
): boolean {
  const isExploreEnabled = !!deps.explore;
  const obsOwnsMonitorCreation = !!deps.observabilityDashboards?.ownsMonitorCreation;
  return isExploreEnabled && !obsOwnsMonitorCreation;
}
