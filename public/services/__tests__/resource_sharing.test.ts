/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getResourceSharingAvailableTypes, setClient, setSecurityDashboards } from '../services';

const mockGet = jest.fn();

const respondPerRoute = (info: any, types: any) => (url: string) => {
  if (url.includes('resource_sharing_enabled')) return Promise.resolve(info);
  if (url.includes('resource/types')) return Promise.resolve(types);
  return Promise.resolve({});
};

// By default, security-dashboards-plugin's local-SPI check confirms every
// type it is asked about. Individual tests override this per case.
const mockSecurityDashboards = (spiConfirms: (type: string) => boolean = () => true) => {
  setSecurityDashboards({
    ui: {
      isResourceSharingAvailable: (type: string) => Promise.resolve(spiConfirms(type)),
    },
  } as any);
};

describe('getResourceSharingAvailableTypes', () => {
  beforeEach(() => {
    mockGet.mockReset();
    setClient({ get: mockGet } as any);
    mockSecurityDashboards();
  });

  it('returns [] (global gate) when the feature flag is disabled, even if types exist', async () => {
    mockGet.mockImplementation(
      respondPerRoute({ enabled: false }, { types: [{ type: 'monitor' }] })
    );
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual([]);
    // per-type probe should be short-circuited when the global flag is off
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('returns the protected type names when enabled and the local SPI confirms each one', async () => {
    mockGet.mockImplementation(
      respondPerRoute({ enabled: true }, { types: [{ type: 'monitor' }, { type: 'workflow' }] })
    );
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual([
      'monitor',
      'workflow',
    ]);
  });

  it('handles a bare array types response (no { types } wrapper)', async () => {
    mockGet.mockImplementation(respondPerRoute({ enabled: true }, [{ type: 'monitor' }]));
    await expect(getResourceSharingAvailableTypes()).resolves.toEqual(['monitor']);
  });

  it('filters out malformed type entries', async () => {
    mockGet.mockImplementation(
      respondPerRoute({ enabled: true }, { types: [{ type: 'monitor' }, {}, { type: '' }] })
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

  it('returns [] without probing when security-dashboards-plugin is not installed', async () => {
    setSecurityDashboards(undefined as any);
    mockGet.mockImplementation(
      respondPerRoute({ enabled: true }, { types: [{ type: 'monitor' }] })
    );
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual([]);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('drops a type that the backend reports as registered but the local SPI does not confirm', async () => {
    // Simulates: local cluster has resource sharing disabled (so the SPI
    // never started) while the selected data source reports it enabled.
    mockSecurityDashboards((type) => type === 'workflow');
    mockGet.mockImplementation(
      respondPerRoute({ enabled: true }, { types: [{ type: 'monitor' }, { type: 'workflow' }] })
    );
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual(['workflow']);
  });

  it('drops a type when the local SPI confirmation throws', async () => {
    setSecurityDashboards({
      ui: { isResourceSharingAvailable: () => Promise.reject(new Error('boom')) },
    } as any);
    mockGet.mockImplementation(
      respondPerRoute({ enabled: true }, { types: [{ type: 'monitor' }] })
    );
    await expect(getResourceSharingAvailableTypes('ds-1')).resolves.toEqual([]);
  });
});
