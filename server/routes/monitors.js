/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { createValidateQuerySchema } from '../services/utils/helpers';

export default function (services, router, dataSourceEnabled) {
  const { monitorService } = services;

  const fieldValidations = {
    from: schema.number(),
    size: schema.number(),
    search: schema.string(),
    sortField: schema.string(),
    sortDirection: schema.string(),
    state: schema.string(),
    monitorIds: schema.maybe(schema.any()),
  };

  const alertsFieldValidations = {
    from: schema.number(),
    size: schema.number(),
    search: schema.string(),
    sortField: schema.string(),
    sortDirection: schema.string(),
    severityLevel: schema.string(),
    alertState: schema.string(),
    // Optional filters commonly sent by the UI
    monitorIds: schema.maybe(schema.any()),
    monitorType: schema.maybe(schema.string()),
  };

  router.get(
    {
      path: '/api/alerting/v2/monitors/alerts',
      validate: { 
        query: createValidateQuerySchema(dataSourceEnabled, {
          monitorIds: schema.maybe(schema.any()),
          monitorType: schema.maybe(schema.string()),
          severityLevel: schema.maybe(schema.string()),
          alertState: schema.maybe(schema.string()),
          search: schema.maybe(schema.string()),
          from: schema.maybe(schema.number()),
          size: schema.maybe(schema.number()),
          sortField: schema.maybe(schema.string()),
          sortDirection: schema.maybe(schema.string()),
        })
      },
    },
    monitorService.alertsForMonitorsV2
  );

  router.get(
    {
      path: '/api/alerting/indices',
     validate: {
       query:
         createValidateQuerySchema(dataSourceEnabled, {}) ||
         schema.object({}),   // <= important fallback
     },
    },
    monitorService.listIndices
  );

  // v2 monitors (PPL monitors)
  router.get(
    {
      path: '/api/alerting/monitors',
      validate: { query: createValidateQuerySchema(dataSourceEnabled, fieldValidations) },
    },
    monitorService.getMonitors
  );

  // v1 monitors (classic/legacy monitors)
  router.get(
    {
      path: '/api/alerting/monitors/v1',
      validate: { query: createValidateQuerySchema(dataSourceEnabled, fieldValidations) },
    },
    monitorService.getMonitorsV1
  );

  // ---------- NEW: data-source–aware proxy for SQL/PPL ----------
  // Matches the required format:
  //   POST /_plugins/_ppl
  //   { "query": "<PPL text>" }
  router.post(
    {
      path: '/_plugins/_ppl',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.pplQuery
  );
  // --------------------------------------------------------------

  // v2 search
  router.post(
    {
      path: '/api/alerting/v2/monitors/_search',
      validate: { body: schema.any(), query: createValidateQuerySchema(dataSourceEnabled) },
    },
    monitorService.searchMonitorsV2
  );

  // ⚠️ Keep this legacy URL working for callers like Dashboard & others;
  // we forward to the same v2 search handler under the hood.
  router.post(
    {
      path: '/api/alerting/monitors/_search',
      validate: { body: schema.any(), query: createValidateQuerySchema(dataSourceEnabled) },
    },
    monitorService.searchMonitorsV2
  );

  router.post(
    {
      path: '/api/alerting/monitors',
      validate: { body: schema.any(), query: createValidateQuerySchema(dataSourceEnabled) },
    },
    monitorService.createMonitor
  );

  router.post(
    {
      path: '/api/alerting/v2/monitors',
      validate: { body: schema.any(), query: createValidateQuerySchema(dataSourceEnabled) },
    },
    monitorService.createPPLMonitor
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
    monitorService.updatePPLMonitor
  );

  router.get(
    {
      path: '/api/alerting/v2/monitors/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.getPPLMonitor
  );

  router.delete(
    {
      path: '/api/alerting/v2/monitors/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.deletePPLMonitor
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
    monitorService.executePPLMonitorById
  );

  router.post(
    {
      path: '/api/alerting/v2/monitors/_execute',
      validate: { body: schema.any(), query: createValidateQuerySchema(dataSourceEnabled) },
    },
    monitorService.executePPLMonitor
  );

  router.get(
    {
      path: '/api/alerting/v2/alerts',
      validate: { query: createValidateQuerySchema(dataSourceEnabled, alertsFieldValidations) },
    },
    monitorService.alertsPPLMonitor
  );

  router.post(
    {
      path: '/api/alerting/workflows',
      validate: { body: schema.any(), query: createValidateQuerySchema(dataSourceEnabled) },
    },
    monitorService.createWorkflow
  );

  // legacy execute endpoint still exposed by UI; server auto-routes to v2 when needed
  router.post(
    {
      path: '/api/alerting/monitors/_execute',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled, {
          dryrun: schema.maybe(schema.string()),
        }),
      },
    },
    monitorService.executeMonitor
  );

  router.get(
    {
      path: '/api/alerting/workflows/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.getWorkflow
  );

  router.get(
    {
      path: '/api/alerting/monitors/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.getMonitor
  );

  const fieldValidationForMonitors = {
    ifSeqNo: schema.maybe(schema.number()),
    ifPrimaryTerm: schema.maybe(schema.number()),
  };

  router.put(
    {
      path: '/api/alerting/monitors/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled, fieldValidationForMonitors),
      },
    },
    monitorService.updateMonitor
  );

  router.put(
    {
      path: '/api/alerting/workflows/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        query: createValidateQuerySchema(dataSourceEnabled, fieldValidationForMonitors),
        body: schema.any(),
      },
    },
    monitorService.updateMonitor
  );

  router.delete(
    {
      path: '/api/alerting/monitors/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        // ⬇️ Make version optional so the same route can delete v2 monitors (no version) or legacy (with version).
        query: createValidateQuerySchema(dataSourceEnabled, { version: schema.maybe(schema.number()) }),
      },
    },
    monitorService.deleteMonitor
  );

  router.delete(
    {
      path: '/api/alerting/workflows/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        // ⬇️ Same here.
        query: createValidateQuerySchema(dataSourceEnabled, { version: schema.maybe(schema.number()) }),
      },
    },
    monitorService.deleteWorkflow
  );

  router.post(
    {
      path: '/api/alerting/monitors/{id}/_acknowledge/alerts',
      validate: {
        params: schema.object({ id: schema.string() }),
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.acknowledgeAlerts
  );

  router.post(
    {
      path: '/api/alerting/workflows/{id}/_acknowledge/alerts',
      validate: {
        params: schema.object({ id: schema.string() }),
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.acknowledgeChainedAlerts
  );
}
