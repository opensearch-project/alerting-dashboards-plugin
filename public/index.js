/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertingPlugin } from './plugin';

export { default as CreateMonitor } from './pages/CreateMonitor';

export function plugin(initializerContext) {
  return new AlertingPlugin(initializerContext);
}
