// Mock core server modules that MDSEnabledClientService imports
jest.mock('../../../../src/core/server', () => ({}), { virtual: true });
jest.mock('../../../../src/core/server/utils', () => ({
  getWorkspaceState: jest.fn(),
}));

import MonitorService from './MonitorService';
import AlertService from './AlertService';
import { getWorkspaceState } from '../../../../src/core/server/utils';

const createMockContext = (endpoint = 'https://col.us-west-2.aoss.amazonaws.com') => ({
  core: {
    savedObjects: {
      client: {
        get: jest.fn().mockResolvedValue({
          attributes: { endpoint },
          workspaces: ['ws-1'],
        }),
      },
    },
  },
});

const createMockReq = (overrides = {}) => ({
  query: { dataSourceId: 'ds-1', ...overrides.query },
  params: { id: 'mon-1', ...overrides.params },
  body: overrides.body || {},
  headers: {
    'x-amzn-aosd-username': 'arn:aws:sts::123456:assumed-role/Admin/user1',
    ...overrides.headers,
  },
});

const createMockRes = () => ({
  ok: jest.fn((payload) => payload),
});

const setupService = (ServiceClass, { authorized = true, endpoint } = {}) => {
  const service = new ServiceClass();
  service.getClientBasedOnDataSource = jest.fn().mockReturnValue(jest.fn().mockResolvedValue({}));

  const mockAuthorizeWorkspace = jest.fn().mockResolvedValue({ authorized });
  service.setWorkspaceStart({ authorizeWorkspace: mockAuthorizeWorkspace });

  // Mock checkWorkspaceAcl to control behavior directly for API-level tests
  // For checkWorkspaceAcl unit tests, we test the real implementation
  return { service, mockAuthorizeWorkspace };
};

describe('Workspace ACL checks', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = createMockRes();
    getWorkspaceState.mockReturnValue({ requestWorkspaceId: 'ws-1' });
  });

  describe('checkWorkspaceAcl', () => {
    it('should skip ACL check when no dataSourceId is present', async () => {
      const { service } = setupService(MonitorService, { authorized: false });
      const context = createMockContext();
      const req = createMockReq({ query: { dataSourceId: undefined } });

      const result = await service.checkWorkspaceAcl(context, req, ['read']);
      expect(result).toBe(true);
    });

    it('should skip ACL check for non-AOSS (managed domain) endpoints', async () => {
      const { service } = setupService(MonitorService, { authorized: false });
      const context = createMockContext('https://search-domain.us-west-2.es.amazonaws.com');
      const req = createMockReq();

      const result = await service.checkWorkspaceAcl(context, req, ['read']);
      expect(result).toBe(true);
    });

    it('should run ACL check for AOSS endpoints and return true when authorized', async () => {
      const { service, mockAuthorizeWorkspace } = setupService(MonitorService, {
        authorized: true,
      });
      const context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      const req = createMockReq();

      const result = await service.checkWorkspaceAcl(context, req, ['library_read']);
      expect(result).toBe(true);
      expect(mockAuthorizeWorkspace).toHaveBeenCalledWith(
        req,
        ['ws-1'],
        'arn:aws:sts::123456:assumed-role/Admin/user1',
        ['library_read']
      );
    });

    it('should return false when workspace authorization fails for AOSS', async () => {
      const { service } = setupService(MonitorService, { authorized: false });
      const context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      const req = createMockReq();

      const result = await service.checkWorkspaceAcl(context, req, ['library_read']);
      expect(result).toBe(false);
    });

    it('should skip ACL check when no principal header', async () => {
      const { service } = setupService(MonitorService, { authorized: false });
      const context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      const req = createMockReq({ headers: { 'x-amzn-aosd-username': undefined } });

      const result = await service.checkWorkspaceAcl(context, req, ['read']);
      // Will return true because principal is falsy
      expect(result).toBe(true);
    });

    it('should skip ACL check when workspaceStart is not set', async () => {
      const service = new MonitorService();
      service.getClientBasedOnDataSource = jest.fn().mockReturnValue(jest.fn());
      // Don't call setWorkspaceStart
      const context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      const req = createMockReq();

      const result = await service.checkWorkspaceAcl(context, req, ['read']);
      expect(result).toBe(true);
    });
  });

  describe('MonitorService - _enforceWorkspaceAcl', () => {
    it('should return null when checkWorkspaceAcl returns true', async () => {
      const { service } = setupService(MonitorService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(true);

      const result = await service._enforceWorkspaceAcl({}, {}, mockRes, ['library_write']);
      expect(result).toBeNull();
      expect(mockRes.ok).not.toHaveBeenCalled();
    });

    it('should return unauthorized response when checkWorkspaceAcl returns false', async () => {
      const { service } = setupService(MonitorService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(false);

      await service._enforceWorkspaceAcl({}, {}, mockRes, ['library_write']);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });
  });

  describe('MonitorService - API methods block unauthorized requests', () => {
    let service;

    beforeEach(() => {
      ({ service } = setupService(MonitorService));
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(false);
    });

    it('createMonitor should block', async () => {
      const req = createMockReq({ body: { name: 'test' } });
      await service.createMonitor({}, req, mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('createWorkflow should block', async () => {
      const req = createMockReq({ body: { name: 'test' } });
      await service.createWorkflow({}, req, mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('deleteMonitor should block', async () => {
      await service.deleteMonitor({}, createMockReq(), mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('deleteWorkflow should block', async () => {
      await service.deleteWorkflow({}, createMockReq(), mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('getMonitor should block', async () => {
      await service.getMonitor({}, createMockReq(), mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('getWorkflow should block', async () => {
      await service.getWorkflow({}, createMockReq(), mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('updateMonitor should block', async () => {
      const req = createMockReq({ body: { type: 'monitor' } });
      await service.updateMonitor({}, req, mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('getMonitors should block', async () => {
      const req = createMockReq({
        query: {
          dataSourceId: 'ds-1',
          from: 0,
          size: 20,
          search: '',
          sortDirection: 'desc',
          sortField: 'name',
          state: 'all',
        },
      });
      await service.getMonitors({}, req, mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('acknowledgeAlerts should block', async () => {
      const req = createMockReq({ body: { alerts: [] } });
      await service.acknowledgeAlerts({}, req, mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('executeMonitor should block', async () => {
      const req = createMockReq({ body: {} });
      await service.executeMonitor({}, req, mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('searchMonitors should block', async () => {
      const req = createMockReq({ body: {} });
      await service.searchMonitors({}, req, mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });
  });

  describe('MonitorService - API methods allow authorized requests', () => {
    it('createMonitor should proceed when authorized', async () => {
      const { service } = setupService(MonitorService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(true);
      const mockClient = jest.fn().mockResolvedValue({ _id: 'mon-1', _version: 1 });
      service.getClientBasedOnDataSource = jest.fn().mockReturnValue(mockClient);

      const req = createMockReq({ body: { name: 'test' } });
      await service.createMonitor({}, req, mockRes);
      expect(mockClient).toHaveBeenCalledWith('alerting.createMonitor', { body: { name: 'test' } });
    });
  });

  describe('AlertService - _enforceWorkspaceAcl', () => {
    it('should return null when authorized', async () => {
      const { service } = setupService(AlertService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(true);

      const result = await service._enforceWorkspaceAcl({}, {}, mockRes, ['library_read']);
      expect(result).toBeNull();
    });

    it('should return unauthorized response when not authorized', async () => {
      const { service } = setupService(AlertService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(false);

      await service._enforceWorkspaceAcl({}, {}, mockRes, ['library_read']);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });
  });

  describe('AlertService - API methods block unauthorized requests', () => {
    let service;

    beforeEach(() => {
      ({ service } = setupService(AlertService));
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(false);
    });

    it('getAlerts should block', async () => {
      const req = createMockReq({ query: { dataSourceId: 'ds-1' } });
      await service.getAlerts({}, req, mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('getWorkflowAlerts should block', async () => {
      const req = createMockReq({ query: { dataSourceId: 'ds-1' } });
      await service.getWorkflowAlerts({}, req, mockRes);
      expect(mockRes.ok).toHaveBeenCalledWith({
        body: { ok: false, resp: 'Workspace ACL check failed: unauthorized' },
      });
    });
  });

  describe('AlertService - API methods allow authorized requests', () => {
    it('getAlerts should proceed when authorized', async () => {
      const { service } = setupService(AlertService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(true);
      const mockClient = jest
        .fn()
        .mockResolvedValueOnce({ alerts: [], totalAlerts: 0 })
        .mockResolvedValueOnce({ hits: { hits: [] } });
      service.getClientBasedOnDataSource = jest.fn().mockReturnValue(mockClient);

      const req = createMockReq({ query: { dataSourceId: 'ds-1' } });
      await service.getAlerts({}, req, mockRes);
      expect(mockClient).toHaveBeenCalled();
      expect(mockRes.ok).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.objectContaining({ ok: true }) })
      );
    });
  });
});
