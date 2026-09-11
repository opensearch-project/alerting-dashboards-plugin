/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getInitialValues } from './helpers';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../../utils/constants';

const pplMonitorToEdit = {
  name: 'ppl-monitor',
  monitor_type: MONITOR_TYPE.PPL,
  enabled: true,
  query: 'source = logs | stats count() by status',
  schedule: { period: { interval: 1, unit: 'MINUTES' } },
  triggers: [],
};

const queryLevelMonitorToEdit = {
  name: 'query-monitor',
  monitor_type: MONITOR_TYPE.QUERY_LEVEL,
  enabled: true,
  schedule: { period: { interval: 1, unit: 'MINUTES' } },
  inputs: [
    {
      search: {
        indices: ['logs'],
        query: { size: 0, query: { match_all: {} } },
      },
    },
  ],
  triggers: [],
  ui_metadata: {
    schedule: { frequency: 'interval', period: { interval: 1, unit: 'MINUTES' } },
    search: { searchType: SEARCH_TYPE.QUERY },
  },
};

describe('getInitialValues on edit', () => {
  test('preserves dataSourceId from the edit-page URL for PPL monitors', () => {
    const initialValues = getInitialValues({
      location: { search: '?action=edit-monitor&dataSourceId=my-data-source-id' },
      monitorToEdit: pplMonitorToEdit,
      edit: true,
    });

    // The hydrated monitor carries no dataSourceId, so it must be retained
    // from the URL for preview/field-detection calls to route correctly.
    expect(initialValues.dataSourceId).toBe('my-data-source-id');
    // Sanity: PPL hydration still populated the query.
    expect(initialValues.pplQuery).toBe(pplMonitorToEdit.query);
    expect(initialValues.monitor_type).toBe(MONITOR_TYPE.PPL);
  });

  test('preserves dataSourceId from the edit-page URL for non-PPL monitors', () => {
    const initialValues = getInitialValues({
      location: { search: '?action=edit-monitor&dataSourceId=my-data-source-id' },
      monitorToEdit: queryLevelMonitorToEdit,
      edit: true,
    });

    expect(initialValues.dataSourceId).toBe('my-data-source-id');
  });

  test('does not fabricate a dataSourceId when the URL has none', () => {
    const initialValues = getInitialValues({
      location: { search: '?action=edit-monitor' },
      monitorToEdit: pplMonitorToEdit,
      edit: true,
    });

    // Falls back to whatever the hydrator produced (no URL override applied).
    expect(initialValues.dataSourceId).not.toBe('my-data-source-id');
  });
});
