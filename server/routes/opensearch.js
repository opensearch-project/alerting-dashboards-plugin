/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { createValidateQuerySchema } from '../services/utils/helpers';

export default function (services, router, dataSourceEnabled) {
  const { opensearchService } = services;

  router.post(
    {
      path: '/api/alerting/_search',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
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
        query: createValidateQuerySchema(dataSourceEnabled),
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
        query: createValidateQuerySchema(dataSourceEnabled),
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
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    opensearchService.getMappings
  );

  router.get(
    {
      path: '/api/alerting/_plugins',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    opensearchService.getPlugins
  );

  router.get(
    {
      path: '/api/alerting/_settings',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    opensearchService.getSettings
  );

  router.get(
    {
      path: '/api/alerting/_health',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    opensearchService.getClusterHealth
  );
}
