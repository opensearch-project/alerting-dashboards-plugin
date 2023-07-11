/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PLUGIN_NAME } from '../utils/constants';
import {
  Plugin,
  CoreSetup,
  CoreStart,
} from '../../../src/core/public';
import { ACTION_ALERTING } from './actions/alerting_dashboard_action';
import { CONTEXT_MENU_TRIGGER, EmbeddableStart } from '../../../src/plugins/embeddable/public';
import { getActions, getAdAction } from './utils/contextMenu/actions';
import { alertingTriggerAd } from './utils/contextMenu/triggers';
import { ExpressionsSetup } from '../../../src/plugins/expressions/public';
import { UiActionsSetup } from '../../../src/plugins/ui_actions/public';
import { overlayAlertsFunction } from './expressions/overlay_alerts';
import { setClient, setEmbeddable, setNotifications, setOverlays, setSavedAugmentVisLoader, setUISettings, setQueryService } from './services';
import { VisAugmenterStart } from '../../../src/plugins/vis_augmenter/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';

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
  embeddable: EmbeddableStart;
  data: DataPublicPluginStart;
}

export class AlertingPlugin implements Plugin<AlertingSetup, AlertingStart, AlertingSetupDeps, AlertingStartDeps> {
  public setup(core: CoreSetup<AlertingStartDeps, AlertingStart>, { expressions, uiActions }: AlertingSetupDeps): AlertingSetup {
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

    setUISettings(core.uiSettings);

    // Set the HTTP client so it can be pulled into expression fns to make
    // direct server-side calls
    setClient(core.http);

    // registers the expression function used to render anomalies on an Augmented Visualization
    expressions.registerFunction(overlayAlertsFunction());

    // Create context menu actions. Pass core, to access service for flyouts.
    const actions = getActions();

    // Add actions to uiActions
    actions.forEach((action) => {
      uiActions.addTriggerAction(CONTEXT_MENU_TRIGGER, action);
    });

    // Create trigger for other plugins to open flyout. Can be used by other plugins like this:
    const adAction = getAdAction();
    uiActions.registerTrigger(alertingTriggerAd);
    uiActions.addTriggerAction(alertingTriggerAd.id, adAction);

    return;
  }

  public start(core: CoreStart, { visAugmenter, embeddable, data }: AlertingStartDeps): AlertingStart {
    setEmbeddable(embeddable);
    setOverlays(core.overlays);
    setQueryService(data.query);
    setSavedAugmentVisLoader(visAugmenter.savedAugmentVisLoader);
    setNotifications(core.notifications);
    return {};
  }

  public stop() {}
}
