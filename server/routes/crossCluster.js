/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

export default function (services, router) {
  const { crossClusterService } = services;

  router.get(
    {
      path: '/api/alerting/remote/indexes',
      validate: {
        query: schema.object({
          indexes: schema.string(),
          include_mappings: schema.maybe(schema.boolean()),
        }),
      },
    },
    crossClusterService.getRemoteIndexes
  );
}
