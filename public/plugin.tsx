/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PLUGIN_NAME } from '../utils/constants';
import { Plugin, CoreSetup, CoreStart } from '../../../src/core/public';
import { ExpressionsSetup } from '../../../src/plugins/expressions/public';
import { UiActionsSetup } from '../../../src/plugins/ui_actions/public';
import { setSavedAugmentVisLoader, setUISettings, setClient } from './services';
import { VisAugmenterStart } from '../../../src/plugins/vis_augmenter/public';
import { overlayAlertsFunction } from './expressions/overlay_alerts';

export interface AlertingSetup {}

export interface AlertingStart {}

export interface AlertingSetupDeps {
  expressions: ExpressionsSetup;
  uiActions: UiActionsSetup;
}

export interface AlertingStartDeps {
  visAugmenter: VisAugmenterStart;
}

export class AlertingPlugin implements Plugin<AlertingSetup, AlertingStart, AlertingSetupDeps, AlertingStartDeps> {
  public setup(core: CoreSetup<AlertingSetupDeps, AlertingStart>, { expressions, uiActions }: AlertingSetupDeps): AlertingSetup {
    core.application.register({
      id: PLUGIN_NAME,
      title: 'Alerting',
      description: 'OpenSearch Dashboards Alerting Plugin',
      category: {
        id: 'opensearch',
        label: 'OpenSearch Plugins',
        order: 2000,
      },
      order: 4000,
      mount: async (params) => {
        const { renderApp } = await import('./app');
        const [coreStart] = await core.getStartServices();
        return renderApp(coreStart, params);
      },
    });

    // Set the HTTP client so it can be pulled into expression fns to make
    // direct server-side calls
    setClient(core.http);

    // Register the UI Settings for the helper CRUD Saved Augement Loader functions
    setUISettings(core.uiSettings);

    // registers the expression function used to render anomalies on an Augmented Visualization
    expressions.registerFunction(overlayAlertsFunction());

    return {};
  }

  public start(core: CoreStart, { visAugmenter }: AlertingStartDeps): AlertingStart {
    setSavedAugmentVisLoader(visAugmenter.savedAugmentVisLoader);
    return {};
  }
}
