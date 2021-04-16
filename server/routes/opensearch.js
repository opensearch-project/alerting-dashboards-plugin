/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
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
}
