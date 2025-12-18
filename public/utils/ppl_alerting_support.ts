/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from 'opensearch-dashboards/public';
import { fetchAlertingV2Support } from '../pages/CreateMonitor/containers/CreateMonitor/utils/helpers';

export type PplSupportStatus = 'unknown' | 'loading' | 'enabled' | 'disabled';

interface SupportRecord {
  status: PplSupportStatus;
  message?: string;
}

const supportCache = new Map<string, SupportRecord>();
const pendingFetches = new Set<string>();

export const ALERTING_PPL_SUPPORT_EVENT = 'alertingDashboards:pplSupportUpdated';

const sanitizeDataSourceId = (id?: string): string => {
  if (!id || id === 'random-dataSourceId') {
    return '';
  }
  return id;
};

const buildDisabledMessage = (friendlyName?: string) =>
  `PPL alerting is not enabled for ${friendlyName || 'the selected data source'}. Enable the plugins.alerting.v2.enabled (or plugins.v2.enabled) cluster setting or choose a different data source.`;

export const getPplSupportState = (rawId?: string): SupportRecord => {
  const id = sanitizeDataSourceId(rawId);
  if (supportCache.has(id)) {
    return supportCache.get(id)!;
  }

  if (pendingFetches.has(id)) {
    return { status: 'loading' };
  }

  return { status: 'unknown' };
};

export const ensurePplSupport = (
  http: HttpStart,
  rawId?: string,
  friendlyName?: string
) => {
  const id = sanitizeDataSourceId(rawId);
  const cached = supportCache.get(id);
  if (cached && cached.status !== 'unknown') {
    return cached;
  }

  if (pendingFetches.has(id)) {
    return { status: 'loading' as PplSupportStatus };
  }

  pendingFetches.add(id);
  supportCache.set(id, { status: 'loading' });

  fetchAlertingV2Support(http, id)
    .then(({ enabled }) => {
      supportCache.set(id, enabled ? { status: 'enabled' } : { status: 'disabled', message: buildDisabledMessage(friendlyName) });
    })
    .catch((error: any) => {
      const errorMessage = error?.body?.message || error?.message || 'Unable to verify cluster settings.';
      supportCache.set(id, {
        status: 'disabled',
        message: `Failed to verify PPL alerting support. ${errorMessage}`,
      });
    })
    .finally(() => {
      pendingFetches.delete(id);
      window.dispatchEvent(
        new CustomEvent(ALERTING_PPL_SUPPORT_EVENT, {
          detail: { dataSourceId: id },
        })
      );
    });

  return { status: 'loading' as PplSupportStatus };
};

export const isPplSupportEnabled = (rawId?: string) => {
  const state = getPplSupportState(rawId);
  return state.status === 'enabled';
};

