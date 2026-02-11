/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import getOverviewStatsV2 from './getOverviewStatsV2';
import { DEFAULT_EMPTY_DATA } from '../../../../../utils/constants';

describe('getOverviewStatsV2', () => {
  test('returns minimal overview stats for PPL monitors', () => {
    const monitor = {
      description: 'Example description',
      last_update_time: '2024-01-01T00:00:00Z',
      schedule: {
        period: { interval: 5, unit: 'MINUTES' },
      },
    };
    const monitorId = 'monitor-123';
    const activeCount = 3;

    const stats = getOverviewStatsV2(monitor, monitorId, activeCount);

    expect(stats).toHaveProperty('firstRow');
    expect(stats).toHaveProperty('secondRow');
    expect(stats.firstRow).toHaveLength(5);
    expect(stats.firstRow[0]).toEqual({ header: 'Total active alerts', value: activeCount });
    expect(stats.firstRow[1].header).toBe('Schedule');
    expect(stats.firstRow[2].header).toBe('Look back window');
    // Last updated header is now a React element with tooltip
    expect(stats.firstRow[3].header).toBeDefined();
    expect(React.isValidElement(stats.firstRow[3].header)).toBe(true);
    expect(stats.firstRow[4]).toEqual({ header: 'Monitor ID', value: monitorId });
    expect(stats.secondRow).toHaveLength(1);
    expect(stats.secondRow[0]).toEqual({ header: 'Description', value: 'Example description' });
  });

  test('handles missing fields gracefully', () => {
    const stats = getOverviewStatsV2({}, 'id-1');
    expect(stats.secondRow[0]).toEqual({ header: 'Description', value: DEFAULT_EMPTY_DATA });
  });
});
