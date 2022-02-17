/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

export default function (services, router) {
  const { alertService } = services;

  router.get(
    {
      path: '/api/alerting/alerts',
      validate: {
        query: schema.object({
          from: schema.maybe(schema.number()),
          size: schema.number(),
          search: schema.maybe(schema.string()),
          sortField: schema.string(),
          sortDirection: schema.string(),
          severityLevel: schema.maybe(schema.string()),
          alertState: schema.maybe(schema.string()),
          monitorIds: schema.maybe(schema.string()),
        }),
      },
    },
    alertService.getAlerts
  );
}
