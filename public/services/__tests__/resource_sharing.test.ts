/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getResourceCreators, getResourceSharingAvailableTypes, setClient } from '../services';

const mockGet = jest.fn();

const respondPerRoute = (info: any, types: any) => (url: string) => {
  if (url.includes('resource_sharing_enabled')) return Promise.resolve(info);
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
      respondPerRoute({ enabled: false }, { types: [{ type: 'monitor' }] })
    );
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual([]);
    // per-type probe should be short-circuited when the global flag is off
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('returns the protected type names when enabled', async () => {
    mockGet.mockImplementation(
      respondPerRoute(
        { enabled: true },
        { types: [{ type: 'monitor' }, { type: 'alerting-workflow' }] }
      )
    );
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual([
      'monitor',
      'alerting-workflow',
    ]);
  });

  it('handles a bare array types response (no { types } wrapper)', async () => {
    mockGet.mockImplementation(
      respondPerRoute({ enabled: true }, [{ type: 'monitor' }])
    );
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual(['monitor']);
  });

  it('filters out malformed type entries', async () => {
    mockGet.mockImplementation(
      respondPerRoute(
        { enabled: true },
        { types: [{ type: 'monitor' }, {}, { type: '' }] }
      )
    );
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual(['monitor']);
  });

  it('passes the data source id as a query param to both routes', async () => {
    mockGet.mockImplementation(respondPerRoute({ enabled: true }, { types: [] }));
    await getResourceSharingAvailableTypes('ds-9');
    expect(mockGet).toHaveBeenCalledWith('/api/v1/auth/resource_sharing_enabled', {
      query: { dataSourceId: 'ds-9' },
    });
    expect(mockGet).toHaveBeenCalledWith('/api/resource/types', {
      query: { dataSourceId: 'ds-9' },
    });
  });

  it('omits the query when no data source id is provided', async () => {
    mockGet.mockImplementation(respondPerRoute({ enabled: true }, { types: [] }));
    await getResourceSharingAvailableTypes();
    expect(mockGet).toHaveBeenCalledWith('/api/v1/auth/resource_sharing_enabled', { query: {} });
  });

  it('returns [] (fail-closed) when a request throws', async () => {
    mockGet.mockRejectedValue(new Error('boom'));
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual([]);
  });
});

describe('getResourceCreators', () => {
  const listResponse = (...resources: any[]) => ({ resources });

  beforeEach(() => {
    mockGet.mockReset();
    setClient({ get: mockGet } as any);
  });

  it('maps resource ids to creators across all requested types', async () => {
    mockGet.mockImplementation((url: string, { query }: any) =>
      Promise.resolve(
        query.resourceType === 'monitor'
          ? listResponse({ resource_id: 'monitor-1', created_by: { user: 'alice' } })
          : listResponse({ resource_id: 'workflow-1', created_by: { user: 'bob' } })
      )
    );
    const creators = await getResourceCreators(['monitor', 'alerting-workflow'], 'ds-1');
    expect(Object.fromEntries(creators)).toEqual({ 'monitor-1': 'alice', 'workflow-1': 'bob' });
  });

  it('calls the list route once per type with the data source id', async () => {
    mockGet.mockResolvedValue(listResponse());
    await getResourceCreators(['monitor', 'alerting-workflow'], 'ds-9');
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenCalledWith('/api/resource/list', {
      query: { resourceType: 'monitor', dataSourceId: 'ds-9' },
    });
    expect(mockGet).toHaveBeenCalledWith('/api/resource/list', {
      query: { resourceType: 'alerting-workflow', dataSourceId: 'ds-9' },
    });
  });

  it('omits the data source id when none is provided', async () => {
    mockGet.mockResolvedValue(listResponse());
    await getResourceCreators(['monitor']);
    expect(mockGet).toHaveBeenCalledWith('/api/resource/list', {
      query: { resourceType: 'monitor' },
    });
  });

  it('makes no requests for an empty type list', async () => {
    const creators = await getResourceCreators([]);
    expect(creators.size).toBe(0);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('keeps creators from types that succeed when another type fails', async () => {
    mockGet.mockImplementation((url: string, { query }: any) =>
      query.resourceType === 'monitor'
        ? Promise.resolve(listResponse({ resource_id: 'monitor-1', created_by: { user: 'alice' } }))
        : Promise.reject(new Error('403'))
    );
    const creators = await getResourceCreators(['monitor', 'alerting-workflow']);
    expect(Object.fromEntries(creators)).toEqual({ 'monitor-1': 'alice' });
  });

  it('skips malformed responses and records', async () => {
    mockGet.mockImplementation((url: string, { query }: any) =>
      Promise.resolve(
        query.resourceType === 'monitor'
          ? listResponse(
              { resource_id: 'monitor-1', created_by: { user: 'alice' } },
              { resource_id: 'monitor-2', created_by: {} },
              { resource_id: 'monitor-3' },
              { created_by: { user: 'carol' } },
              { resource_id: 'monitor-4', created_by: { user: '' } },
              null
            )
          : { resources: 'not-an-array' }
      )
    );
    const creators = await getResourceCreators(['monitor', 'alerting-workflow']);
    expect(Object.fromEntries(creators)).toEqual({ 'monitor-1': 'alice' });
  });

  it('returns an empty map when the HTTP client is not set', async () => {
    setClient(undefined as any);
    const creators = await getResourceCreators(['monitor']);
    expect(creators.size).toBe(0);
  });
});
