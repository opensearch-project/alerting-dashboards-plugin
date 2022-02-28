/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import alertingADPlugin from './adPlugin';
import { CLUSTER, DEFAULT_HEADERS } from '../../services/utils/constants';

export default function createAlertingADCluster(core, globalConfig) {
  const { customHeaders, ...rest } = globalConfig.opensearch;
  return core.opensearch.legacy.createClient(CLUSTER.AD_ALERTING, {
    plugins: [alertingADPlugin],
    // Currently we are overriding any headers with our own since we explicitly required User-Agent to be OpenSearch Dashboards
    // for integration with our backend plugin.
    // TODO: Change our required header to x-<Header> to avoid overriding
    customHeaders: { ...customHeaders, ...DEFAULT_HEADERS },
    ...rest,
  });
}
