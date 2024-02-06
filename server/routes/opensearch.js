/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

export default function (services, router) {
  const { opensearchService } = services;

  router.post(
    {
      path: '/api/alerting/_search',
      validate: {
        body: schema.any(),
      },
    },
    opensearchService.search
  );

  router.post(
    {
      path: '/api/alerting/_indices',
      validate: {
        body: schema.object({
          index: schema.string(),
        }),
      },
    },
    opensearchService.getIndices
  );

  router.post(
    {
      path: '/api/alerting/_aliases',
      validate: {
        body: schema.object({
          alias: schema.string(),
        }),
      },
    },
    opensearchService.getAliases
  );

  router.post(
    {
      path: '/api/alerting/_mappings',
      validate: {
        body: schema.object({
          index: schema.arrayOf(schema.string()),
        }),
      },
    },
    opensearchService.getMappings
  );

  router.get(
    {
      path: '/api/alerting/_plugins',
      validate: false,
    },
    opensearchService.getPlugins
  );

  router.get(
    {
      path: '/api/alerting/_settings',
      validate: false,
    },
    opensearchService.getSettings
  );

  router.get(
    {
      path: '/api/alerting/_health',
      validate: false,
    },
    opensearchService.getClusterHealth
  );
}
