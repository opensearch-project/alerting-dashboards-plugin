/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

export default function (services, router) {
  const { findingService } = services;

  router.get(
    {
      path: '/api/alerting/findings/_search',
      validate: {
        query: schema.object({
          id: schema.maybe(schema.string()),
          from: schema.number(),
          size: schema.number(),
          search: schema.string(),
          sortField: schema.string(),
          sortDirection: schema.string(),
        }),
      },
    },
    findingService.getFindings
  );
}
