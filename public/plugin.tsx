/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PLUGIN_NAME } from '../utils/constants';
import { Plugin, CoreSetup, CoreStart } from '../../../src/core/public';
import { ACTION_ALERTING } from './actions/alerting_dashboard_action';
import { CONTEXT_MENU_TRIGGER } from '../../../src/plugins/embeddable/public';
import { getActions, getAdAction } from './utils/contextMenu/actions';
import { alertingTriggerAd } from './utils/contextMenu/triggers';
import { ExpressionsSetup } from '../../../src/plugins/expressions/public';
import { UiActionsSetup } from '../../../src/plugins/ui_actions/public';
import { overlayAlertsFunction } from './expressions/overlay_alerts';
import { setClient, setSavedAugmentVisLoader, setUISettings } from './services';
import { VisAugmenterSetup, VisAugmenterStart } from '../../../src/plugins/vis_augmenter/public';

declare module '../../../src/plugins/ui_actions/public' {
  export interface ActionContextMapping {
    [ACTION_ALERTING]: {};
  }
}

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
  public setup(core: CoreSetup<AlertingStartDeps, AlertingStart>, { expressions, uiActions }: AlertingSetupDeps): AlertingSetup {
    console.log("Alerting plugin setup2");
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

    // if (visAugmenter.savedAugmentVisLoader === null || visAugmenter.savedAugmentVisLoader === undefined) {
    //   console.log('no loader set');
    //   console.log(visAugmenter);
    //   console.log('outputted vals');
    // } else {
    //   console.log('loader set');
    //   setSavedAugmentVisLoader(visAugmenter.savedAugmentVisLoader);
    // }
    // if (!(core.uiSettings === null || core.uiSettings === undefined)) {
    //   setUISettings(core.uiSettings);
    // }
    setUISettings(core.uiSettings);

    // Set the HTTP client so it can be pulled into expression fns to make
    // direct server-side calls
    setClient(core.http);

    // registers the expression function used to render anomalies on an Augmented Visualization
    expressions.registerFunction(overlayAlertsFunction());

    const plugins = { expressions, uiActions }

    // Create context menu actions. Pass core, to access service for flyouts.
    const actions = getActions({ core, plugins });

    // Add actions to uiActions
    actions.forEach((action) => {
      uiActions.addTriggerAction(CONTEXT_MENU_TRIGGER, action);
    });

    // Create trigger for other plugins to open flyout. Can be used by other plugins like this:
    // plugins.uiActions.getTrigger('ALERTING_TRIGGER_AD_ID').exec({ embeddable, detectorId });
    const adAction = getAdAction({ core, plugins });
    uiActions.registerTrigger(alertingTriggerAd);
    uiActions.addTriggerAction(alertingTriggerAd.id, adAction);
    //
    // const savedAugmentVisLoader = createSavedAugmentVisLoader({
    //   savedObjectsClient: core.savedObjects.client,
    //   indexPatterns: data.indexPatterns,
    //   search: data.search,
    //   chrome: core.chrome,
    //   overlays: core.overlays,
    // });
    // setSavedAugmentVisLoader(savedAugmentVisLoader);
    return;
  }

  public start(core: CoreStart, { visAugmenter }: AlertingStartDeps): AlertingStart {
    setSavedAugmentVisLoader(visAugmenter.savedAugmentVisLoader);
    // if (!(core.uiSettings === null || core.uiSettings === undefined)) {
    //   setUISettings(core.uiSettings);
    // } else {
    //   console.log('settings is null?');
    // }
    return {};
  }

  public stop() {}
}
