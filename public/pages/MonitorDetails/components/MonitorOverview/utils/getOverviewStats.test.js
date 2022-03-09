/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import getOverviewStats from './getOverviewStats';
import { DEFAULT_EMPTY_DATA } from '../../../../../utils/constants';

describe('getOverviewStats', () => {
  test('can get stats', () => {
    const monitor = {
      enabled: true,
      user: {
        name: 'John Doe',
      },
    };
    const monitorId = 'sdfifsjeifjseif';
    const monitorVersion = 7;
    const activeCount = 17;
    expect(getOverviewStats(monitor, monitorId, monitorVersion, activeCount)).toEqual([
      {
        header: 'Monitor type',
        value: 'Per query monitor',
      },
      {
        header: 'Monitor definition type',
        value: 'Extraction Query',
      },
      {
        header: 'Total active alerts',
        value: activeCount,
      },
      {
        header: 'Schedule',
        value: DEFAULT_EMPTY_DATA,
      },
      {
        header: 'Last updated',
        value: DEFAULT_EMPTY_DATA,
      },
      {
        header: 'Monitor ID',
        value: monitorId,
      },
      {
        header: 'Monitor version number',
        value: monitorVersion,
      },
      {
        header: 'Last updated by',
        value: monitor.user.name,
      },
    ]);
  });
});
