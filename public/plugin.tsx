/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PLUGIN_NAME } from '../utils/constants';
import { Plugin } from '../../../src/core/public';
import { ACTION_ALERTING } from './actions/alerting_dashboard_action';
import { CONTEXT_MENU_TRIGGER } from '../../../src/plugins/embeddable/public';
import { getActions, getAdAction } from './utils/contextMenu/actions';
import { alertingTriggerAd } from './utils/contextMenu/triggers';
import { overlayAlertsFunction } from './expressions/overlay_alerts';
import { setClient } from './services';

declare module '../../../src/plugins/ui_actions/public' {
  export interface ActionContextMapping {
    [ACTION_ALERTING]: {};
  }
}

export class AlertingPlugin implements Plugin {
  public setup(core, plugins) {
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

    // registers the expression function used to render anomalies on an Augmented Visualization
    plugins.expressions.registerFunction(overlayAlertsFunction());

    // Create context menu actions. Pass core, to access service for flyouts.
    const actions = getActions({ core, plugins });

    // Add actions to uiActions
    actions.forEach((action) => {
      plugins.uiActions.addTriggerAction(CONTEXT_MENU_TRIGGER, action);
    });

    // Create trigger for other plugins to open flyout. Can be used by other plugins like this:
    // plugins.uiActions.getTrigger('ALERTING_TRIGGER_AD_ID').exec({ embeddable, detectorId });
    const adAction = getAdAction({ core, plugins });
    plugins.uiActions.registerTrigger(alertingTriggerAd);
    plugins.uiActions.addTriggerAction(alertingTriggerAd.id, adAction);
  }

  public start() {}

  public stop() {}
}
