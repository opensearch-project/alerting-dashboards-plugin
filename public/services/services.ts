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
import { AssistantSetup } from '../types';

const ServicesContext = createContext<BrowserServices | null>(null);

const ServicesConsumer = ServicesContext.Consumer;

export { ServicesContext, ServicesConsumer };

export const [getClient, setClient] =
  createGetterSetter<CoreStart['http']>('http');

export const [getSavedAugmentVisLoader, setSavedAugmentVisLoader] = createGetterSetter<
  SavedObjectLoaderAugmentVis
  >('savedAugmentVisLoader');

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');
export const [getAssistantDashboards, setAssistantDashboards] = createGetterSetter<
  AssistantSetup | {}
>('assistantDashboards');

export const [getEmbeddable, setEmbeddable] = createGetterSetter<EmbeddableStart>('embeddable');

export const [getOverlays, setOverlays] =
  createGetterSetter<OverlayStart>('Overlays');

export const [getQueryService, setQueryService] = createGetterSetter<
  DataPublicPluginStart['query']
  >('Query');

export const [getSavedObjectsClient, setSavedObjectsClient] =
  createGetterSetter<CoreStart['savedObjects']['client']>('SavedObjectsClient');

export const [getDataSourceManagementPlugin, setDataSourceManagementPlugin] =
  createGetterSetter<DataSourceManagementPluginSetup>('DataSourceManagement');

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
