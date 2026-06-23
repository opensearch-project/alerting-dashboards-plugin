/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { createValidateQuerySchema, getDynamicConfig } from '../services/utils/helpers';
import { FEATURE_FLAGS } from '../services/utils/constants';

export default function (services, router, dataSourceEnabled, coreSetup, logger) {
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

  const serviceCallWrapper = async (context, req, res, serviceMethod) => {
    const config = await getDynamicConfig(req, coreSetup);
    if (config[FEATURE_FLAGS.PPL_MONITOR]) {
      return serviceMethod(context, req, res);
    } else {
      // use logger to log warning
      logger?.warn(
        `[Alerting][PPLAlertingRouter] PPL Alerting is not enabled in the app config for app: ${req.headers['x-amzn-aosd-app-id']}`
      );
    }
  };

  router.post(
    {
      path: '/_plugins/_ppl',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => serviceCallWrapper(context, req, res, pplMonitorService.proxyPPLQuery)
  );

  router.get(
    {
      path: '/api/alerting/indices',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, {}),
      },
    },
    (context, req, res) => serviceCallWrapper(context, req, res, pplMonitorService.listIndices)
  );

  router.get(
    {
      path: '/api/alerting/v2/monitors',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, listFieldValidations),
      },
    },
    (context, req, res) => serviceCallWrapper(context, req, res, pplMonitorService.getMonitors)
  );

  router.post(
    {
      path: '/api/alerting/v2/monitors/_search',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => serviceCallWrapper(context, req, res, pplMonitorService.searchMonitors)
  );

  router.post(
    {
      path: '/api/alerting/v2/monitors',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => serviceCallWrapper(context, req, res, pplMonitorService.createMonitor)
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
    (context, req, res) => serviceCallWrapper(context, req, res, pplMonitorService.updateMonitor)
  );

  router.get(
    {
      path: '/api/alerting/v2/monitors/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => serviceCallWrapper(context, req, res, pplMonitorService.getMonitor)
  );

  router.delete(
    {
      path: '/api/alerting/v2/monitors/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => serviceCallWrapper(context, req, res, pplMonitorService.deleteMonitor)
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
    (context, req, res) =>
      serviceCallWrapper(context, req, res, pplMonitorService.executeMonitorById)
  );

  router.post(
    {
      path: '/api/alerting/v2/monitors/_execute',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    (context, req, res) => serviceCallWrapper(context, req, res, pplMonitorService.executeMonitor)
  );

  router.get(
    {
      path: '/api/alerting/v2/monitors/alerts',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, alertsFieldValidations),
      },
    },
    (context, req, res) =>
      serviceCallWrapper(context, req, res, pplMonitorService.alertsForMonitors)
  );
}
