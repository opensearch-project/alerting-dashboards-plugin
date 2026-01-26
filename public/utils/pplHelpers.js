/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { backendErrorNotification } from './helpers';

export const isPplMonitor = (monitor) => {
  if (!monitor) return false;

  const mode = monitor.monitor_mode || monitor.monitorMode;
  if (mode && String(mode).toLowerCase() === 'ppl') {
    return true;
  }

  const queryLanguage =
    monitor.query_language || monitor.queryLanguage || monitor.monitor_type || monitor.monitorType;
  if (queryLanguage && String(queryLanguage).toLowerCase() === 'ppl') {
    return true;
  }

  if (monitor.monitor_v2?.ppl_monitor || monitor.ppl_monitor) {
    return true;
  }

  return false;
};

export async function deletePplMonitor(monitor, httpClient, notifications, dataSourceQuery) {
  const monitorId = monitor?.id;
  if (!monitorId) {
    return Promise.resolve({ ok: false, resp: 'Monitor ID missing' });
  }

  const query = dataSourceQuery?.query ? { ...dataSourceQuery.query } : undefined;

  return httpClient
    .delete(`../api/alerting/v2/monitors/${monitorId}`, { query })
    .then((resp) => {
      if (!resp.ok) {
        backendErrorNotification(notifications, 'delete', 'monitor', resp.resp);
      } else {
        notifications.toasts.addSuccess('Monitor deleted successfully.');
      }
      return resp;
    })
    .catch((err) => err);
}
