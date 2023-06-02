/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PLUGIN_NAME } from '../utils/constants';
import { Plugin, CoreSetup, CoreStart } from '../../../src/core/public';
import { ExpressionsSetup } from '../../../src/plugins/expressions/public';
import { UiActionsSetup } from '../../../src/plugins/ui_actions/public';
import { setSavedAugmentVisLoader, setUISettings, setClient } from './services';
import { VisAugmenterSetup, VisAugmenterStart } from '../../../src/plugins/vis_augmenter/public';

export interface AlertingSetup {}

export interface AlertingStart {}

export interface AlertingSetupDeps {
  expressions: ExpressionsSetup;
  uiActions: UiActionsSetup;
  visAugmenter: VisAugmenterSetup;
}

export interface AlertingStartDeps {
  visAugmenter: VisAugmenterStart;
}

export class AlertingPlugin implements Plugin<AlertingSetup, AlertingStart, AlertingSetupDeps, AlertingStartDeps> {
  public setup(core: CoreSetup<AlertingStartDeps, AlertingStart>, { expressions, uiActions, visAugmenter }: AlertingSetupDeps): AlertingSetup {
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

    setUISettings(core.uiSettings);

    return {};
  }

  public start(core: CoreStart, { visAugmenter }: AlertingStartDeps): AlertingStart {
    setSavedAugmentVisLoader(visAugmenter.savedAugmentVisLoader);
    return {};
  }
}
