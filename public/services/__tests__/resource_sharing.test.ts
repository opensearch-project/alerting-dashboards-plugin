/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getResourceSharingAvailableTypes, setClient } from '../services';

const mockGet = jest.fn();

const respondPerRoute = (info: any, types: any) => (url: string) => {
  if (url.includes('dashboardsinfo')) return Promise.resolve(info);
  if (url.includes('resource/types')) return Promise.resolve(types);
  return Promise.resolve({});
};

describe('getResourceSharingAvailableTypes', () => {
  beforeEach(() => {
    mockGet.mockReset();
    setClient({ get: mockGet } as any);
  });

  it('returns [] (global gate) when the feature flag is disabled, even if types exist', async () => {
    mockGet.mockImplementation(
      respondPerRoute({ resource_sharing_enabled: false }, { types: [{ type: 'monitor' }] })
    );
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual([]);
    // per-type probe should be short-circuited when the global flag is off
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('returns the protected type names when enabled', async () => {
    mockGet.mockImplementation(
      respondPerRoute(
        { resource_sharing_enabled: true },
        { types: [{ type: 'monitor' }, { type: 'workflow' }] }
      )
    );
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual(['monitor', 'workflow']);
  });

  it('handles a bare array types response (no { types } wrapper)', async () => {
    mockGet.mockImplementation(
      respondPerRoute({ resource_sharing_enabled: true }, [{ type: 'monitor' }])
    );
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual(['monitor']);
  });

  it('filters out malformed type entries', async () => {
    mockGet.mockImplementation(
      respondPerRoute(
        { resource_sharing_enabled: true },
        { types: [{ type: 'monitor' }, {}, { type: '' }] }
      )
    );
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual(['monitor']);
  });

  it('passes the data source id as a query param to both routes', async () => {
    mockGet.mockImplementation(respondPerRoute({ resource_sharing_enabled: true }, { types: [] }));
    await getResourceSharingAvailableTypes('ds-9');
    expect(mockGet).toHaveBeenCalledWith('/api/v1/auth/dashboardsinfo', {
      query: { dataSourceId: 'ds-9' },
    });
    expect(mockGet).toHaveBeenCalledWith('/api/resource/types', {
      query: { dataSourceId: 'ds-9' },
    });
  });

  it('omits the query when no data source id is provided', async () => {
    mockGet.mockImplementation(respondPerRoute({ resource_sharing_enabled: true }, { types: [] }));
    await getResourceSharingAvailableTypes();
    expect(mockGet).toHaveBeenCalledWith('/api/v1/auth/dashboardsinfo', { query: {} });
  });

  it('returns [] (fail-closed) when a request throws', async () => {
    mockGet.mockRejectedValue(new Error('boom'));
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual([]);
  });
});
