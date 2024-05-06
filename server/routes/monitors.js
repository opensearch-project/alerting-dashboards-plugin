/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { validateQuery } from '../services/utils/helpers';

export default function (services, router, dataSourceEnabled) {
  const { monitorService } = services;

  router.get(
    {
      path: '/api/alerting/monitors',
      validate: {
        query: schema.object({
          from: schema.number(),
          size: schema.number(),
          search: schema.string(),
          sortField: schema.string(),
          sortDirection: schema.string(),
          state: schema.string(),
          monitorIds: schema.maybe(schema.any()),
        }),
      },
    },
    monitorService.getMonitors
  );

  router.post(
    {
      path: '/api/alerting/monitors/_search',
      validate: {
        body: schema.any(),
        query: validateQuery(dataSourceEnabled),
      },
    },
    monitorService.searchMonitors
  );

  router.post(
    {
      path: '/api/alerting/monitors',
      validate: {
        body: schema.any(),
        query: validateQuery(dataSourceEnabled),
      },
    },
    monitorService.createMonitor
  );

  router.post(
    {
      path: '/api/alerting/workflows',
      validate: {
        body: schema.any(),
        query: validateQuery(dataSourceEnabled),
      },
    },
    monitorService.createWorkflow
  );

  router.post(
    {
      path: '/api/alerting/monitors/_execute',
      validate: {
        query: schema.object({
          dryrun: schema.maybe(schema.string()),
        }),
        body: schema.any(),
        query: validateQuery(dataSourceEnabled),
      },
    },
    monitorService.executeMonitor
  );

  router.get(
    {
      path: '/api/alerting/workflows/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: validateQuery(dataSourceEnabled),
      },
    },
    monitorService.getWorkflow
  );

  router.get(
    {
      path: '/api/alerting/monitors/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: validateQuery(dataSourceEnabled),
      },
    },
    monitorService.getMonitor
  );

  router.put(
    {
      path: '/api/alerting/monitors/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: schema.object({
          ifSeqNo: schema.maybe(schema.number()),
          ifPrimaryTerm: schema.maybe(schema.number()),
        }),
        body: schema.any(),
        query: validateQuery(dataSourceEnabled),
      },
    },
    monitorService.updateMonitor
  );

  router.put(
    {
      path: '/api/alerting/workflows/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: schema.object({
          ifSeqNo: schema.maybe(schema.number()),
          ifPrimaryTerm: schema.maybe(schema.number()),
        }),
        body: schema.any(),
        query: validateQuery(dataSourceEnabled),
      },
    },
    monitorService.updateMonitor
  );

  router.delete(
    {
      path: '/api/alerting/monitors/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: schema.object({
          version: schema.number(),
        }),
      },
    },
    monitorService.deleteMonitor
  );

  router.delete(
    {
      path: '/api/alerting/workflows/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: schema.object({
          version: schema.number(),
        }),
      },
    },
    monitorService.deleteWorkflow
  );

  router.post(
    {
      path: '/api/alerting/monitors/{id}/_acknowledge/alerts',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        body: schema.any(),
        query: validateQuery(dataSourceEnabled),
      },
    },
    monitorService.acknowledgeAlerts
  );

  router.post(
    {
      path: '/api/alerting/workflows/{id}/_acknowledge/alerts',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        body: schema.any(),
        query: validateQuery(dataSourceEnabled),
      },
    },
    monitorService.acknowledgeChainedAlerts
  );
}
