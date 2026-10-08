/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { DEFAULT_EMPTY_DATA } from './constants';
import {
  ALERTING_WORKFLOW_RESOURCE_TYPE,
  MONITOR_RESOURCE_TYPE,
  getResourceCreator,
  getResourceSharingAvailableTypes,
} from '../services/services';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * Who created a monitor, from the first source that has it:
 *   1. the resource-sharing record, when resource sharing is enabled (passed in by the caller),
 *   2. the server-owned monitor.created_by (Alerting 3.11+),
 *   3. ui_metadata.created_by.
 * Returns DEFAULT_EMPTY_DATA when none is set.
 */
export const getMonitorCreator = (monitor, resourceSharingCreator) =>
  [resourceSharingCreator, monitor?.created_by, monitor?.ui_metadata?.created_by].find(
    isNonEmptyString
  ) ?? DEFAULT_EMPTY_DATA;

export const getMonitorResourceType = (monitor) =>
  monitor?.type === 'workflow' ? ALERTING_WORKFLOW_RESOURCE_TYPE : MONITOR_RESOURCE_TYPE;

/**
 * The creator of one monitor from its resource-sharing record. Undefined until
 * resolved, and when resource sharing is not enabled for the monitor's type on
 * the data source.
 */
export const useResourceSharingCreator = (monitorId, resourceType, dataSourceId) => {
  const [creator, setCreator] = useState(undefined);
  useEffect(() => {
    // Ignore a response for a monitor or data source the page has since moved away from.
    let current = true;
    setCreator(undefined);
    if (!monitorId) return undefined;
    (async () => {
      const types = await getResourceSharingAvailableTypes(dataSourceId);
      if (!current || !types.includes(resourceType)) return;
      const resolved = await getResourceCreator(monitorId, resourceType, dataSourceId);
      if (current) setCreator(resolved);
    })();
    return () => {
      current = false;
    };
  }, [monitorId, resourceType, dataSourceId]);
  return creator;
};
