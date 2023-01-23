/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertingPlugin } from './plugin';

export { MonitorDetails } from './components/FeatureAnywhereContextMenu/CreateAlertingMonitor/MonitorDetails';
export { Triggers } from './components/FeatureAnywhereContextMenu/CreateAlertingMonitor/Triggers';
export { Advanced } from './components/FeatureAnywhereContextMenu/CreateAlertingMonitor/Advanced';
export { getInitialValues, useMonitorFrequencyText } from './utils/contextMenu/helpers';

export function plugin(initializerContext) {
  return new AlertingPlugin(initializerContext);
}
