/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { MONITOR_TYPE, SEARCH_TYPE } from '../utils/constants';

export const buildPplMonitorForTriggers = (values) => {
  const triggers = _.cloneDeep(values.triggerDefinitions || []);
  const rawIndices = Array.isArray(values.index)
    ? values.index.map((entry) => entry?.value || entry?.label).filter(Boolean)
    : [];
  const indices = rawIndices.length ? rawIndices : ['*'];
  return {
    name: values.name || '',
    type: 'monitor',
    monitor_type: values.monitor_type || MONITOR_TYPE.QUERY_LEVEL,
    enabled: true,
    schedule: { period: { interval: 1, unit: 'MINUTES' } },
    inputs: [{ search: { indices, query: { size: 0, query: { match_all: {} } } } }],
    ui_metadata: { search: { searchType: SEARCH_TYPE.PPL }, triggers: {} },
    triggers,
    ppl_monitor: { query: values.pplQuery || '', triggers },
  };
};
