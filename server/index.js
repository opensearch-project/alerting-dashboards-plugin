/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { AlertingPlugin } from './plugin';

export const configSchema = schema.object({
  enabled: schema.boolean({ defaultValue: true }),
});

export const config = {
  exposeToBrowser: {
    // following configs are visible to browser side plugin
    enabled: true,
  },
  schema: configSchema,
};

// entry point
export function plugin(initializerContext) {
  return new AlertingPlugin(initializerContext);
}
