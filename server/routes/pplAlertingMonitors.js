/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { createValidateQuerySchema } from '../services/utils/helpers';

export default function (services, router, dataSourceEnabled) {
  const { pplMonitorService } = services;
  if (!pplMonitorService) {
    return;
  }

  const listFieldValidations = {
    from: schema.maybe(schema.number()),
    size: schema.maybe(schema.number()),
    search: schema.maybe(schema.string()),
    sortField: schema.maybe(schema.string()),
    sortDirection: schema.maybe(schema.string()),
    state: schema.maybe(schema.string()),
  };

  const alertsFieldValidations = {
    from: schema.maybe(schema.number()),
    size: schema.maybe(schema.number()),
    search: schema.maybe(schema.string()),
    sortField: schema.maybe(schema.string()),
    sortDirection: schema.maybe(schema.string()),
    severityLevel: schema.maybe(schema.string()),
    alertState: schema.maybe(schema.string()),
    monitorIds: schema.maybe(schema.any()),
    monitorId: schema.maybe(schema.string()),
  };

  router.post(
    {
      path: '/_plugins/_ppl',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => pplMonitorService.proxyPPLQuery(context, req, res)
  );

  router.get(
    {
      path: '/api/alerting/indices',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, {}),
      },
    },
    (context, req, res) => pplMonitorService.listIndices(context, req, res)
  );

  router.get(
    {
      path: '/api/alerting/v2/monitors',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, listFieldValidations),
      },
    },
    (context, req, res) => pplMonitorService.getMonitors(context, req, res)
  );

  router.post(
    {
      path: '/api/alerting/v2/monitors/_search',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => pplMonitorService.searchMonitors(context, req, res)
  );

  router.post(
    {
      path: '/api/alerting/v2/monitors',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => pplMonitorService.createMonitor(context, req, res)
  );

  router.put(
    {
      path: '/api/alerting/v2/monitors/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled, {
          if_seq_no: schema.maybe(schema.number()),
          if_primary_term: schema.maybe(schema.number()),
        }),
      },
    },
    (context, req, res) => pplMonitorService.updateMonitor(context, req, res)
  );

  router.get(
    {
      path: '/api/alerting/v2/monitors/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => pplMonitorService.getMonitor(context, req, res)
  );

  router.delete(
    {
      path: '/api/alerting/v2/monitors/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => pplMonitorService.deleteMonitor(context, req, res)
  );

  router.post(
    {
      path: '/api/alerting/v2/monitors/{id}/_execute',
      validate: {
        params: schema.object({ id: schema.string() }),
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => pplMonitorService.executeMonitorById(context, req, res)
  );

  router.post(
    {
      path: '/api/alerting/v2/monitors/_execute',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => pplMonitorService.executeMonitor(context, req, res)
  );

  router.get(
    {
      path: '/api/alerting/v2/monitors/alerts',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, alertsFieldValidations),
      },
    },
    (context, req, res) => pplMonitorService.alertsForMonitors(context, req, res)
  );
}
