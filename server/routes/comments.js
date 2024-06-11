/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { createValidateQuerySchema } from '../services/utils/helpers';

export default function (services, router, dataSourceEnabled) {
  const { commentsService } = services;

  router.post(
    {
      path: '/api/alerting/comments/_search',
      validate: {
        body: schema.any(),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    commentsService.searchComments
  );

  router.post(
    {
      path: '/api/alerting/comments/{alertId}',
      validate: {
        body: schema.any(),
        params: schema.object({
          alertId: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    commentsService.createComment
  );

  router.put(
    {
      path: '/api/alerting/comments/{commentId}',
      validate: {
        body: schema.any(),
        params: schema.object({
          commentId: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    commentsService.updateComment
  );

  router.delete(
    {
      path: '/api/alerting/comments/{commentId}',
      validate: {
        params: schema.object({
          commentId: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    commentsService.deleteComment
  );
}
