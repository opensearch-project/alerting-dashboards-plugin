/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { createValidateQuerySchema } from '../services/utils/helpers';

export default function (services, router, dataSourceEnabled) {
  const { findingService } = services;

  const fieldValidations = {
    id: schema.maybe(schema.string()),
    from: schema.number(),
    size: schema.number(),
    search: schema.string(),
    sortField: schema.string(),
    sortDirection: schema.string(),
  };
  router.get(
    {
      path: '/api/alerting/findings/_search',
      validate: {
        query: createValidateQuerySchema(dataSourceEnabled, fieldValidations),
      },
    },
    findingService.getFindings
  );
}
