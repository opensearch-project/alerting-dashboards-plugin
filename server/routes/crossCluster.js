/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { createValidateQuerySchema } from '../services/utils/helpers';

export default function (services, router, dataSourceEnabled) {
  const { crossClusterService } = services;

  const fieldValidations = {
    indexes: schema.string(),
    include_mappings: schema.maybe(schema.boolean()),
  };

  router.get(
    {
      path: '/api/alerting/remote/indexes',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, fieldValidations),
      },
    },
    crossClusterService.getRemoteIndexes
  );
}
