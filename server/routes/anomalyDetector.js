/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { createValidateQuerySchema } from '../services/utils/helpers';

export default function (services, router) {
  const { anomalyDetectorService } = services;

  router.get(
    {
      path: '/api/alerting/detectors/{detectorId}',
      validate: {
        params: schema.object({
          detectorId: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    anomalyDetectorService.getDetector
  );

  router.post(
    {
      path: '/api/alerting/detectors/_search',
      validate: false,
    },
    anomalyDetectorService.getDetectors
  );

  router.get(
    {
      path: '/api/alerting/detectors/{detectorId}/results',
      validate: {
        params: schema.object({
          detectorId: schema.string(),
        }),
        query: createValidateQuerySchema(dataSourceEnabled),
      },
    },
    anomalyDetectorService.getDetectorResults
  );
}
