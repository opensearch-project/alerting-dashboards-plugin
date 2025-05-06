/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext } from 'react';
import { BrowserServices, DataSourceEnabled, DataSource, DataSourceReadOnly } from '../models/interfaces';
import { createGetterSetter } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { DataSourceManagementPluginSetup } from '../../../../src/plugins/data_source_management/public';
import { CoreStart, IUiSettingsClient, NotificationsStart, OverlayStart } from '../../../../src/core/public';
import { SavedObjectLoaderAugmentVis } from '../../../../src/plugins/vis_augmenter/public';
import { DataPublicPluginStart } from '../../../../src/plugins/data/public';
import { EmbeddableStart } from '../../../../src/plugins/embeddable/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';
import { ContentManagementPluginStart } from '../../../../src/plugins/content_management/public';
import { createNullableGetterSetter } from './utils/helper';
import { AssistantSetup, AssistantPublicPluginStart } from '../types';

const ServicesContext = createContext<BrowserServices | null>(null);

const ServicesConsumer = ServicesContext.Consumer;

export { ServicesContext, ServicesConsumer };

export const [getClient, setClient] =
  createGetterSetter<CoreStart['http']>('http');

export const [getSavedAugmentVisLoader, setSavedAugmentVisLoader] = createGetterSetter<
  SavedObjectLoaderAugmentVis
  >('savedAugmentVisLoader');

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');

export const [getAssistantDashboards, setAssistantDashboards] = createGetterSetter<AssistantSetup>(
  'assistantDashboards'
);

export const [getAssistantClient, setAssistantClient] =
  createGetterSetter<AssistantPublicPluginStart['assistantClient'] | {}>('AssistantClient');

export const [getEmbeddable, setEmbeddable] = createGetterSetter<EmbeddableStart>('embeddable');

export const [getOverlays, setOverlays] =
  createGetterSetter<OverlayStart>('Overlays');

export const [getQueryService, setQueryService] = createGetterSetter<
  DataPublicPluginStart['query']
  >('Query');

export const [getSavedObjectsClient, setSavedObjectsClient] =
  createGetterSetter<CoreStart['savedObjects']['client']>('SavedObjectsClient');

export const [getDataSourceManagementPlugin, setDataSourceManagementPlugin] = createNullableGetterSetter<DataSourceManagementPluginSetup>();

export const [getDataSourceEnabled, setDataSourceEnabled] =
  createGetterSetter<DataSourceEnabled>('DataSourceEnabled');

setDataSourceEnabled({enabled: false}); // default value

export const [getDataSource, setDataSource] =
  createGetterSetter<DataSource>('DataSource');

// Initialize with some initial value
export const [getDataSourceReadOnly, setDataSourceReadOnly] =
  createGetterSetter<DataSourceReadOnly>('DataSourceReadOnly');

export const [getNotifications, setNotifications] =
  createGetterSetter<NotificationsStart>('Notifications');

export const [getNavigationUI, setNavigationUI] = createGetterSetter<NavigationPublicPluginStart['ui']>('navigation');

export const [getApplication, setApplication] = createGetterSetter<CoreStart['application']>('application');

export const getUseUpdatedUx = () => {
  return getUISettings().get('home:useNewHomePage', false);
};

export const [getContentManagementStart, setContentManagementStart] = createGetterSetter<ContentManagementPluginStart>('contentManagementStart');
