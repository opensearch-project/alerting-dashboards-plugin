/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { deletePplMonitor, isPplMonitor } from './pplHelpers';
import coreMock from '../../test/mocks/CoreMock';
import { httpClientMock } from '../../test/mocks';

describe('isPplMonitor', () => {
  test('returns true for monitors with monitor_mode ppl', () => {
    expect(isPplMonitor({ monitor_mode: 'ppl' })).toBe(true);
    expect(isPplMonitor({ monitorMode: 'PPL' })).toBe(true);
  });

  test('returns true for monitors with ppl monitor_v2 wrapper', () => {
    expect(isPplMonitor({ monitor_v2: { ppl_monitor: {} } })).toBe(true);
    expect(isPplMonitor({ ppl_monitor: {} })).toBe(true);
  });

  test('returns false for non-ppl monitors', () => {
    expect(isPplMonitor({ monitor_mode: 'legacy' })).toBe(false);
    expect(isPplMonitor(null)).toBe(false);
  });
});

describe('deletePplMonitor', () => {
  test('calls v2 delete endpoint', async () => {
    const monitor = { id: 'ppl_id' };
    const dataSourceQuery = { query: { dataSourceId: 'test-ds' } };
    httpClientMock.delete = jest.fn().mockResolvedValue({ ok: true });
    coreMock.notifications.toasts.addSuccess.mockClear();

    const response = await deletePplMonitor(
      monitor,
      httpClientMock,
      coreMock.notifications,
      dataSourceQuery
    );

    expect(httpClientMock.delete).toHaveBeenCalledTimes(1);
    expect(httpClientMock.delete).toHaveBeenCalledWith('../api/alerting/v2/monitors/ppl_id', {
      query: { dataSourceId: 'test-ds' },
    });
    expect(response).toEqual({ ok: true });
  });
});
