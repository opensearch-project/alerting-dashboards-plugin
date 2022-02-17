/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

export default function (services, router) {
  const { anomalyDetectorService } = services;

  router.get(
    {
      path: '/api/alerting/detectors/{detectorId}',
      validate: {
        params: schema.object({
          detectorId: schema.string(),
        }),
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
        query: schema.any(),
      },
    },
    anomalyDetectorService.getDetectorResults
  );
}
