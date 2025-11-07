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

  router.get(
    {
      path: '/api/alerting/monitors',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, fieldValidations),
      },
    },
    monitorService.getMonitors
  );

  router.get(
    {
      path: '/api/alerting/monitors/v1',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, fieldValidations),
      },
    },
    monitorService.getMonitors
  );

  router.post(
    {
      path: '/api/alerting/monitors/_search',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.searchMonitors
  );

  router.post(
    {
      path: '/api/alerting/monitors',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.createMonitor
  );

  router.post(
    {
      path: '/api/alerting/workflows',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.createWorkflow
  );

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
        params: schema.object({
          id: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
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
        params: schema.object({
          id: schema.string(),
        }),
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
        params: schema.object({
          id: schema.string(),
        }),
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
        params: schema.object({
          id: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled, {
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
        query: createValidateQuerySchema(dataSourceEnabled, {
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
        query: createValidateQuerySchema(dataSourceEnabled),
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
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    monitorService.acknowledgeChainedAlerts
  );
}
