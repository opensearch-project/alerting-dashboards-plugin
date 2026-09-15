/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext } from 'react';
import semver from 'semver';
import {
  BrowserServices,
  DataSourceEnabled,
  DataSource,
  DataSourceReadOnly,
} from '../models/interfaces';
import { createGetterSetter } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { DataSourceManagementPluginSetup } from '../../../../src/plugins/data_source_management/public';
import {
  CoreStart,
  IUiSettingsClient,
  NotificationsStart,
  OverlayStart,
} from '../../../../src/core/public';
import { SavedObjectLoaderAugmentVis } from '../../../../src/plugins/vis_augmenter/public';
import { DataPublicPluginStart } from '../../../../src/plugins/data/public';
import { EmbeddableStart } from '../../../../src/plugins/embeddable/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';
import { ContentManagementPluginStart } from '../../../../src/plugins/content_management/public';
import { createNullableGetterSetter } from './utils/helper';
import { AssistantSetup, AssistantPublicPluginStart } from '../types';
import { SecurityPluginStart } from '../../../security-dashboards-plugin/public/types';
import { BASE_PPL_ALERTING_SUPPORTED_VERSION } from '../utils/constants';

const ServicesContext = createContext<BrowserServices | null>(null);

const ServicesConsumer = ServicesContext.Consumer;

export { ServicesContext, ServicesConsumer };

export const [getClient, setClient] = createGetterSetter<CoreStart['http']>('http');

// Optional: only set when security-dashboards-plugin is installed (see plugin.tsx
// start()). Its presence alone doesn't guarantee its client-side DOM-marker SPI is
// running -- callers should use securityDashboards.ui.isResourceSharingAvailable,
// which is itself gated on that, rather than presence alone.
export const [getSecurityDashboards, setSecurityDashboards] =
  createNullableGetterSetter<SecurityPluginStart>();

export const [getSavedAugmentVisLoader, setSavedAugmentVisLoader] =
  createGetterSetter<SavedObjectLoaderAugmentVis>('savedAugmentVisLoader');

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');

export const [getAssistantDashboards, setAssistantDashboards] =
  createGetterSetter<AssistantSetup>('assistantDashboards');

export const [getAssistantClient, setAssistantClient] = createGetterSetter<
  AssistantPublicPluginStart['assistantClient'] | {}
>('AssistantClient');

export const [getEmbeddable, setEmbeddable] = createGetterSetter<EmbeddableStart>('embeddable');

export const [getOverlays, setOverlays] = createGetterSetter<OverlayStart>('Overlays');

export const [getQueryService, setQueryService] =
  createGetterSetter<DataPublicPluginStart['query']>('Query');

export const [getSavedObjectsClient, setSavedObjectsClient] =
  createGetterSetter<CoreStart['savedObjects']['client']>('SavedObjectsClient');

export const [getDataSourceManagementPlugin, setDataSourceManagementPlugin] =
  createNullableGetterSetter<DataSourceManagementPluginSetup>();

export const [getDataSourceEnabled, setDataSourceEnabled] =
  createGetterSetter<DataSourceEnabled>('DataSourceEnabled');

setDataSourceEnabled({ enabled: false }); // default value

export const [getDataSource, setDataSource] = createGetterSetter<DataSource>('DataSource');

// Initialize with some initial value
export const [getDataSourceReadOnly, setDataSourceReadOnly] =
  createGetterSetter<DataSourceReadOnly>('DataSourceReadOnly');

export interface DataSourceMetadata {
  dataSourceVersion?: string;
  dataSourceEngineType?: string;
  dataSourceLabel?: string;
  isMustang?: boolean;
}

export const [getDataSourceMetadata, setDataSourceMetadata] =
  createNullableGetterSetter<DataSourceMetadata>();

export const [getNotifications, setNotifications] =
  createGetterSetter<NotificationsStart>('Notifications');

export const [getNavigationUI, setNavigationUI] =
  createGetterSetter<NavigationPublicPluginStart['ui']>('navigation');

export const [getApplication, setApplication] =
  createGetterSetter<CoreStart['application']>('application');

export const isPplAlertingEnabled = () => {
  const application = getApplication();
  const capabilities = application?.capabilities as Record<string, any> | undefined;
  if (capabilities?.alertingDashboards?.pplV2) return true;

  const metadata = getDataSourceMetadata();
  if (metadata?.dataSourceEngineType === 'OpenSearch Serverless') return true;
  if (
    metadata?.dataSourceVersion &&
    semver.gte(
      semver.coerce(metadata.dataSourceVersion) || '0.0.0',
      BASE_PPL_ALERTING_SUPPORTED_VERSION
    )
  )
    return true;

  return false;
};

export const isServerlessEnabled = () => {
  const application = getApplication();
  const capabilities = application?.capabilities as Record<string, any> | undefined;
  return !!capabilities?.alertingDashboards?.serverlessEnabled;
};

/**
 * Resource types registered by the alerting backend plugin with the security
 * plugin's resource-sharing framework (AlertingResourceSharingExtension).
 */
export const MONITOR_RESOURCE_TYPE = 'monitor';
export const ALERTING_WORKFLOW_RESOURCE_TYPE = 'workflow';

/**
 * Resource-sharing types available on the given data source. Combines the
 * feature-flag gate (`/api/v1/auth/resource_sharing_enabled`, evaluated per
 * data source) with the registered/protected type list (`/api/resource/types`).
 * Returns [] when disabled or on error (fail-closed).
 *
 * These backend checks alone are not sufficient: the Share button is mounted
 * by security-dashboards-plugin's client-side DOM-marker SPI, which only runs
 * when resource sharing is enabled on the *local* cluster. In a multi-data-source
 * deployment where the local cluster has it disabled but the *selected* data
 * source has it enabled, the checks above would say "available" even though no
 * Share button can ever mount, rendering an Access column that is permanently
 * empty. So each candidate type is re-confirmed against
 * `securityDashboards.ui.isResourceSharingAvailable`, which is gated on the
 * local SPI. If security-dashboards-plugin isn't installed, this fails closed
 * to [] as well: with no plugin, no Share button can mount either.
 */
export const getResourceSharingAvailableTypes = async (
  resourceDataSourceId?: string
): Promise<string[]> => {
  const securityDashboards = getSecurityDashboards();
  if (!securityDashboards) return [];
  try {
    const http = getClient();
    const query = resourceDataSourceId ? { dataSourceId: resourceDataSourceId } : {};
    // Global gate: resource sharing must be enabled on the selected data source.
    const info: any = await http.get('/api/v1/auth/resource_sharing_enabled', {
      query,
    });
    if (!info?.enabled) return [];
    // Per-type gate: the registered/protected shareable types on that source.
    const typesResp: any = await http.get('/api/resource/types', { query });
    const rawTypes = Array.isArray(typesResp) ? typesResp : (typesResp?.types ?? []);
    const candidateTypes: string[] = rawTypes
      .map((entry: { type: string }) => entry?.type)
      .filter((type: string | undefined): type is string => Boolean(type));

    // Local-SPI gate: re-confirm each candidate can actually get a Share
    // button, rather than trusting the selected data source's response alone.
    const confirmations = await Promise.all(
      candidateTypes.map((candidateType) =>
        securityDashboards.ui
          .isResourceSharingAvailable(candidateType, resourceDataSourceId)
          .catch(() => false)
      )
    );
    return candidateTypes.filter((_candidateType, index) => confirmations[index]);
  } catch (e) {
    return [];
  }
};

export const getUseUpdatedUx = () => {
  return getUISettings().get('home:useNewHomePage', false);
};

export const [getContentManagementStart, setContentManagementStart] =
  createGetterSetter<ContentManagementPluginStart>('contentManagementStart');

export const OS_SERVERLESS_ENGINE_TYPE = 'OpenSearch Serverless';
export const isServerlessDataSource = () =>
  getDataSourceMetadata()?.dataSourceEngineType === OS_SERVERLESS_ENGINE_TYPE;
