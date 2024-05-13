/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { createValidateQuerySchema } from '../services/utils/helpers';

export default function (services, router, dataSourceEnabled) {
  const { alertService } = services;

  const fieldValidations = {
    from: schema.maybe(schema.number()),
    size: schema.number(),
    search: schema.maybe(schema.string()),
    sortField: schema.string(),
    sortDirection: schema.string(),
    severityLevel: schema.maybe(schema.string()),
    alertState: schema.maybe(schema.string()),
    monitorIds: schema.maybe(schema.string()),
    monitorType: schema.maybe(schema.string()),
  };

  router.get(
    {
      path: '/api/alerting/alerts',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, fieldValidations),
      },
    },
    alertService.getAlerts
  );

  const workflowFieldValidations = {
    workflowIds: schema.string(),
    getAssociatedAlerts: schema.boolean(),
    sortString: schema.string(),
    sortOrder: schema.string(),
    startIndex: schema.number(),
    size: schema.number(),
    severityLevel: schema.maybe(schema.string()),
    alertState: schema.maybe(schema.string()),
    searchString: schema.maybe(schema.string()),
    alertIds: schema.string(),
  };

  router.get(
    {
      path: '/api/alerting/workflows/alerts',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, workflowFieldValidations),
      },
    },
    alertService.getWorkflowAlerts
  );
}
