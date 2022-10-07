/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { PLUGIN_NAME } from '../utils/constants';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../src/core/public';
import { DashboardSetup } from '../../../src/plugins/dashboard/public';
import {
  ACTION_ALERTING,
  AlertingAction,
  AlertingActionContext,
} from './actions/alerting_dashboard_action';
import { CONTEXT_MENU_TRIGGER } from '../../../src/plugins/embeddable/public';
import { UiActionsSetup, UiActionsStart } from '../../../src/plugins/ui_actions/public';
import { createOpenSearchDashboardsReactContext } from '../../../src/plugins/opensearch_dashboards_react/public';
import DashboardMenu from './components/DashboardMenu';

export class AlertingPlugin implements Plugin {
  private exampleEmbeddableFactories = {};

  constructor(initializerContext) {
    // can retrieve config from initializerContext
  }

  setup(core, plugins) {
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

    const context = createOpenSearchDashboardsReactContext({ ...core, ...plugins });
    const {
      value: { overlays },
    } = context;

    // This does not work
    const openMenu = async () => {
      const services = await core.getStartServices();
      console.log({ services });
      const openFlyout = services[0].overlays.openFlyout;
      openFlyout(<DashboardMenu />);
    };
    const alertingAction = new AlertingAction({ openMenu });
    const { uiActions } = plugins;
    uiActions.registerAction(alertingAction);
    uiActions.attachAction(CONTEXT_MENU_TRIGGER, alertingAction.id);

    return {};
  }

  public start(core, deps) {
    // Open menu at start for now
    const {
      value: { overlays },
    } = createOpenSearchDashboardsReactContext(core);

    overlays.openFlyout(<DashboardMenu />);

    return {
      factories: this.exampleEmbeddableFactories,
    };
  }
}
