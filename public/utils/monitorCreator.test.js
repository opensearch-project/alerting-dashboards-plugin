/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, waitFor } from '@testing-library/react';
import {
  getMonitorCreator,
  getMonitorResourceType,
  useResourceSharingCreator,
} from './monitorCreator';
import { getResourceCreator, getResourceSharingAvailableTypes } from '../services/services';

jest.mock('../services/services', () => ({
  ...jest.requireActual('../services/services'),
  getResourceCreator: jest.fn(),
  getResourceSharingAvailableTypes: jest.fn(),
}));

describe('getMonitorCreator', () => {
  const monitor = { created_by: 'carol', ui_metadata: { created_by: 'dave' } };

  test('prefers the resource-sharing creator', () => {
    expect(getMonitorCreator(monitor, 'alice')).toBe('alice');
  });

  test('falls back to created_by, then ui_metadata.created_by', () => {
    expect(getMonitorCreator(monitor)).toBe('carol');
    expect(getMonitorCreator({ ui_metadata: { created_by: 'dave' } })).toBe('dave');
  });

  test('skips empty and non-string values', () => {
    expect(getMonitorCreator({ created_by: ' ', ui_metadata: { created_by: 'dave' } }, '')).toBe(
      'dave'
    );
    expect(getMonitorCreator({ created_by: 42, ui_metadata: { created_by: {} } })).toBe('-');
  });

  test('returns the empty placeholder when no creator is known', () => {
    expect(getMonitorCreator({})).toBe('-');
    expect(getMonitorCreator(undefined)).toBe('-');
  });
});

describe('getMonitorResourceType', () => {
  test('maps composite monitors to the alerting-workflow type', () => {
    expect(getMonitorResourceType({ type: 'workflow' })).toBe('alerting-workflow');
    expect(getMonitorResourceType({ type: 'monitor' })).toBe('monitor');
  });
});

describe('useResourceSharingCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns the creator when resource sharing is enabled for the type', async () => {
    getResourceSharingAvailableTypes.mockResolvedValue(['monitor']);
    getResourceCreator.mockResolvedValue('alice');

    const { result } = renderHook(() => useResourceSharingCreator('monitor-1', 'monitor', 'ds-1'));

    await waitFor(() => expect(result.current).toBe('alice'));
    expect(getResourceSharingAvailableTypes).toHaveBeenCalledWith('ds-1');
    expect(getResourceCreator).toHaveBeenCalledWith('monitor-1', 'monitor', 'ds-1');
  });

  test('does not look up the creator when resource sharing is not enabled for the type', async () => {
    getResourceSharingAvailableTypes.mockResolvedValue(['alerting-workflow']);

    const { result } = renderHook(() => useResourceSharingCreator('monitor-1', 'monitor'));

    await waitFor(() => expect(getResourceSharingAvailableTypes).toHaveBeenCalled());
    expect(getResourceCreator).not.toHaveBeenCalled();
    expect(result.current).toBeUndefined();
  });

  test('does nothing without a monitor id', () => {
    const { result } = renderHook(() => useResourceSharingCreator(undefined, 'monitor'));

    expect(getResourceSharingAvailableTypes).not.toHaveBeenCalled();
    expect(result.current).toBeUndefined();
  });

  test('drops a creator that resolves after the monitor changed', async () => {
    getResourceSharingAvailableTypes.mockResolvedValue(['monitor']);
    let resolveFirst;
    getResourceCreator.mockImplementation((id) =>
      id === 'monitor-1'
        ? new Promise((resolve) => {
            resolveFirst = resolve;
          })
        : Promise.resolve('bob')
    );

    const { result, rerender } = renderHook(({ id }) => useResourceSharingCreator(id, 'monitor'), {
      initialProps: { id: 'monitor-1' },
    });
    await waitFor(() => expect(resolveFirst).toBeDefined());
    rerender({ id: 'monitor-2' });
    await waitFor(() => expect(result.current).toBe('bob'));

    resolveFirst('alice');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current).toBe('bob');
  });
});
