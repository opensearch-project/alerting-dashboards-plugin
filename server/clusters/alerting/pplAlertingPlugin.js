/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPL_MONITOR_BASE_API } from '../../services/utils/constants';

export default function pplAlertingPlugin(Client, config, components) {
  const ca = components.clientAction.factory;

  Client.prototype.pplAlerting = components.clientAction.namespaceFactory();
  const pplAlerting = Client.prototype.pplAlerting.prototype;

  pplAlerting.getMonitor = ca({
    url: {
      fmt: `${PPL_MONITOR_BASE_API}/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  pplAlerting.createMonitor = ca({
    url: {
      fmt: `${PPL_MONITOR_BASE_API}`,
    },
    needBody: true,
    method: 'POST',
  });

  pplAlerting.updateMonitor = ca({
    url: {
      fmt: `${PPL_MONITOR_BASE_API}/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'PUT',
  });

  pplAlerting.deleteMonitor = ca({
    url: {
      fmt: `${PPL_MONITOR_BASE_API}/<%=monitorId%>`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  pplAlerting.searchMonitors = ca({
    url: {
      fmt: `${PPL_MONITOR_BASE_API}/_search`,
    },
    needBody: true,
    method: 'POST',
  });

  pplAlerting.executeMonitor = ca({
    url: {
      fmt: `${PPL_MONITOR_BASE_API}/_execute`,
    },
    needBody: true,
    method: 'POST',
  });

  pplAlerting.executeMonitorById = ca({
    url: {
      fmt: `${PPL_MONITOR_BASE_API}/<%=monitorId%>/_execute`,
      req: {
        monitorId: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });
}
