/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ALERTS_NAV_ID, DESTINATIONS_NAV_ID, MONITORS_NAV_ID, PLUGIN_NAME } from '../utils/constants';
import {
  Plugin,
  CoreSetup,
  CoreStart,
  DEFAULT_NAV_GROUPS,
  WorkspaceAvailability,
  AppMountParameters,
  DEFAULT_APP_CATEGORIES,
  AppUpdater,
} from '../../../src/core/public';
import { ACTION_ALERTING } from './actions/alerting_dashboard_action';
import { CONTEXT_MENU_TRIGGER, EmbeddableStart } from '../../../src/plugins/embeddable/public';
import { getActions, getAdAction } from './utils/contextMenu/actions';
import { alertingTriggerAd } from './utils/contextMenu/triggers';
import { ExpressionsSetup } from '../../../src/plugins/expressions/public';
import { UiActionsSetup } from '../../../src/plugins/ui_actions/public';
import { overlayAlertsFunction } from './expressions/overlay_alerts';
import { setClient, setEmbeddable, setNotifications, setOverlays, setSavedAugmentVisLoader, setUISettings, setQueryService, setSavedObjectsClient, setDataSourceEnabled, setDataSourceManagementPlugin, setNavigationUI, setApplication, setContentManagementStart, setAssistantDashboards, setAssistantClient } from './services';
import { VisAugmenterStart } from '../../../src/plugins/vis_augmenter/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';
import { AssistantSetup, AssistantPublicPluginStart  } from './types';
import { DataSourceManagementPluginSetup } from '../../../src/plugins/data_source_management/public';
import { DataSourcePluginSetup } from '../../../src/plugins/data_source/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { BehaviorSubject } from 'rxjs';
import { dataSourceObservable } from './pages/utils/constants';
import { ContentManagementPluginStart } from '../../../src/plugins/content_management/public';
import { registerAlertsCard } from './utils/helpers';

declare module '../../../src/plugins/ui_actions/public' {
  export interface ActionContextMapping {
    [ACTION_ALERTING]: {};
  }
}

export interface AlertingSetup { }

export interface AlertingStart { }

export interface AlertingSetupDeps {
  expressions: ExpressionsSetup;
  uiActions: UiActionsSetup;
  dataSourceManagement: DataSourceManagementPluginSetup;
  dataSource: DataSourcePluginSetup;
  assistantDashboards?: AssistantSetup;
}

export interface AlertingStartDeps {
  visAugmenter: VisAugmenterStart;
  embeddable: EmbeddableStart;
  data: DataPublicPluginStart;
  navigation: NavigationPublicPluginStart;
  contentManagement: ContentManagementPluginStart;
  assistantDashboards: AssistantPublicPluginStart;
}

export class AlertingPlugin implements Plugin<void, AlertingStart, AlertingSetupDeps, AlertingStartDeps> {

  private updateDefaultRouteOfManagementApplications: AppUpdater = () => {
    const dataSourceValue = dataSourceObservable.value?.id;
    let hash = `#/`;
    // When data source value is undefined,
    // it means the data source picker has not determine which data source to use(local or default data source)
    // so we should not append any data source id into hash to avoid impacting the data source picker.
    if (dataSourceValue !== undefined) {
      hash = `#/?dataSourceId=${dataSourceValue}`;
    }
    return {
      defaultPath: hash,
    };
  };

  private appStateUpdater = new BehaviorSubject<AppUpdater>(this.updateDefaultRouteOfManagementApplications);


  public setup(core: CoreSetup<AlertingStartDeps, AlertingStart>, { expressions, uiActions, dataSourceManagement, dataSource, assistantDashboards }: AlertingSetupDeps) {

    const mountWrapper = async (params: AppMountParameters, redirect: string) => {
      const { renderApp } = await import("./app");
      const [coreStart] = await core.getStartServices();
      return renderApp(coreStart, params, redirect);
    };
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

    if (core.chrome.navGroup.getNavGroupEnabled()) {
      // register applications with category and use case information
      core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
        {
          id: PLUGIN_NAME,
          category: DEFAULT_APP_CATEGORIES.detect,
          showInAllNavGroup: false
        }
      ])

      core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS['security-analytics'], [
        {
          id: PLUGIN_NAME,
          category: DEFAULT_APP_CATEGORIES.detect,
          showInAllNavGroup: false
        }
      ])

      core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, [
        {
          id: PLUGIN_NAME,
          category: DEFAULT_APP_CATEGORIES.detect,
          showInAllNavGroup: false
        }
      ])

      // channels route
      core.application.register({
        id: ALERTS_NAV_ID,
        title: 'Alerts',
        order: 9070,
        category: DEFAULT_APP_CATEGORIES.detect,
        updater$: this.appStateUpdater,
        mount: async (params: AppMountParameters) => {
          return mountWrapper(params, "/dashboard");
        },
      });

      core.application.register({
        id: MONITORS_NAV_ID,
        title: 'Monitors',
        order: 9070,
        category: DEFAULT_APP_CATEGORIES.detect,
        updater$: this.appStateUpdater,
        mount: async (params: AppMountParameters) => {
          return mountWrapper(params, "/monitors");
        },
      });

      core.application.register({
        id: DESTINATIONS_NAV_ID,
        title: 'Destinations',
        order: 9070,
        category: DEFAULT_APP_CATEGORIES.detect,
        updater$: this.appStateUpdater,
        mount: async (params: AppMountParameters) => {
          return mountWrapper(params, "/destinations");
        },
      });

      dataSourceObservable.subscribe((dataSourceOption) => {
        if (dataSourceOption) {
          this.appStateUpdater.next(this.updateDefaultRouteOfManagementApplications);
        }
      });

      const navLinks = [
        {
          id: ALERTS_NAV_ID,
          parentNavLinkId: PLUGIN_NAME,
        },
        {
          id: MONITORS_NAV_ID,
          parentNavLinkId: PLUGIN_NAME,
        },
        {
          id: DESTINATIONS_NAV_ID,
          parentNavLinkId: PLUGIN_NAME,
        },
      ];

      core.chrome.navGroup.addNavLinksToGroup(
        DEFAULT_NAV_GROUPS.observability,
        navLinks
      );

      core.chrome.navGroup.addNavLinksToGroup(
        DEFAULT_NAV_GROUPS['security-analytics'],
        navLinks
      );

      core.chrome.navGroup.addNavLinksToGroup(
        DEFAULT_NAV_GROUPS.all,
        navLinks
      );
    }

    setAssistantDashboards(assistantDashboards || { getFeatureStatus: () => ({ chat: false, alertInsight: false }) });
    setUISettings(core.uiSettings);

    // Set the HTTP client so it can be pulled into expression fns to make
    // direct server-side calls
    setClient(core.http);

    setDataSourceManagementPlugin(dataSourceManagement);

    const enabled = !!dataSource;

    setDataSourceEnabled({ enabled });

    // registers the expression function used to render anomalies on an Augmented Visualization
    expressions.registerFunction(overlayAlertsFunction(enabled));

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
  }

  public start(core: CoreStart, { visAugmenter, embeddable, data, navigation, contentManagement, assistantDashboards }: AlertingStartDeps): AlertingStart {
    setEmbeddable(embeddable);
    setOverlays(core.overlays);
    setQueryService(data.query);
    setSavedAugmentVisLoader(visAugmenter.savedAugmentVisLoader);
    setNotifications(core.notifications);
    setSavedObjectsClient(core.savedObjects.client);
    setNavigationUI(navigation.ui);
    setApplication(core.application);
    setContentManagementStart(contentManagement);
    registerAlertsCard();
    if (assistantDashboards)
      setAssistantClient(assistantDashboards.assistantClient);
    return {};
  }
}
