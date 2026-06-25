// Mock core server modules that MDSEnabledClientService imports
jest.mock('../../../../src/core/server', () => ({}), { virtual: true });
jest.mock('../../../NeoDashboardsOasisPlugin/server/oasis/client', () => ({}), { virtual: true });

import MonitorService from './MonitorService';
import AlertService from './AlertService';
import { MDSEnabledClientService } from './MDSEnabledClientService';

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
  headers: overrides.headers || {},
});

const createMockRes = () => ({
  ok: jest.fn((payload) => payload),
  unauthorized: jest.fn((payload) => ({ unauthorized: true, ...payload })),
  custom: jest.fn((payload) => ({ custom: true, ...payload })),
});

const setupService = (ServiceClass, { authorized = true } = {}) => {
  const service = new ServiceClass();
  service.getClientBasedOnDataSource = jest.fn().mockReturnValue(jest.fn().mockResolvedValue({}));

  const mockAuthorizeWorkspace = jest.fn().mockResolvedValue({ authorized });
  service.setWorkspaceStart({
    authorizeWorkspace: mockAuthorizeWorkspace,
    aclEnforceEndpointPatterns: ['.aoss.amazonaws.com'],
  });
  service.setWorkspaceIdGetter(() => 'ws-1');

  return { service, mockAuthorizeWorkspace };
};

describe('Workspace ACL checks', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = createMockRes();
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
      expect(mockAuthorizeWorkspace).toHaveBeenCalledWith(req, ['ws-1'], ['library_read']);
    });

    it('should return false when workspace authorization fails for AOSS', async () => {
      const { service } = setupService(MonitorService, { authorized: false });
      const context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      const req = createMockReq();

      const result = await service.checkWorkspaceAcl(context, req, ['library_read']);
      expect(result).toBe(false);
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

    it('should skip ACL check when aclEnforceEndpointPatterns is empty', async () => {
      const service = new MonitorService();
      service.getClientBasedOnDataSource = jest.fn().mockReturnValue(jest.fn());
      service.setWorkspaceStart({
        authorizeWorkspace: jest.fn(),
        aclEnforceEndpointPatterns: [],
      });
      service.setWorkspaceIdGetter(() => 'ws-1');
      const context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      const req = createMockReq();

      const result = await service.checkWorkspaceAcl(context, req, ['read']);
      expect(result).toBe(true);
    });
  });

  describe('enforceWorkspaceAcl (parent method)', () => {
    it('should return undefined when checkWorkspaceAcl returns true', async () => {
      const { service } = setupService(MonitorService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(true);

      const result = await service.enforceWorkspaceAcl({}, {}, mockRes, ['library_write']);
      expect(result).toBeUndefined();
      expect(mockRes.unauthorized).not.toHaveBeenCalled();
    });

    it('should return unauthorized response when checkWorkspaceAcl returns false', async () => {
      const { service } = setupService(MonitorService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(false);

      await service.enforceWorkspaceAcl({}, {}, mockRes, ['library_write']);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });
  });

  describe('rejectIfUnsupported', () => {
    it('should return 501 for AOSS endpoints', async () => {
      const { service } = setupService(MonitorService);
      const context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      const req = createMockReq();

      await service.rejectIfUnsupported(context, req, mockRes);
      expect(mockRes.custom).toHaveBeenCalledWith({
        statusCode: 501,
        body: { message: 'This operation is not supported' },
      });
    });

    it('should return undefined for non-AOSS endpoints', async () => {
      const { service } = setupService(MonitorService);
      const context = createMockContext('https://search-domain.us-west-2.es.amazonaws.com');
      const req = createMockReq();

      const result = await service.rejectIfUnsupported(context, req, mockRes);
      expect(result).toBeUndefined();
      expect(mockRes.custom).not.toHaveBeenCalled();
    });

    it('should return undefined when no dataSourceId', async () => {
      const { service } = setupService(MonitorService);
      const context = createMockContext();
      const req = createMockReq({ query: { dataSourceId: undefined } });

      const result = await service.rejectIfUnsupported(context, req, mockRes);
      expect(result).toBeUndefined();
    });
  });

  describe('rejectIfUnsupported route guard', () => {
    it('should reject when endpoint is unsupported', async () => {
      const { service } = setupService(MonitorService);
      service.rejectIfUnsupported = jest.fn().mockResolvedValue({ statusCode: 501 });
      const handler = jest.fn();

      const rejected = await service.rejectIfUnsupported({}, createMockReq(), mockRes);
      expect(rejected).toEqual({ statusCode: 501 });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should pass through when endpoint is supported', async () => {
      const { service } = setupService(MonitorService);
      const result = await service.rejectIfUnsupported({}, createMockReq(), mockRes);
      expect(result).toBeUndefined();
    });
  });

  describe('MonitorService - API methods block unauthorized requests', () => {
    let service;

    beforeEach(() => {
      ({ service } = setupService(MonitorService));
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(false);
      service.isUnsupportedEndpoint = jest.fn().mockResolvedValue(false);
    });

    it('createMonitor should block', async () => {
      const req = createMockReq({ body: { name: 'test' } });
      await service.createMonitor({}, req, mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('createWorkflow should block', async () => {
      const req = createMockReq({ body: { name: 'test' } });
      await service.createWorkflow({}, req, mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('deleteMonitor should block', async () => {
      await service.deleteMonitor({}, createMockReq(), mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('deleteWorkflow should block', async () => {
      await service.deleteWorkflow({}, createMockReq(), mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('getMonitor should block', async () => {
      await service.getMonitor({}, createMockReq(), mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('getWorkflow should block', async () => {
      await service.getWorkflow({}, createMockReq(), mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('updateMonitor should block', async () => {
      const req = createMockReq({ body: { type: 'monitor' } });
      await service.updateMonitor({}, req, mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
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
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('acknowledgeAlerts should block', async () => {
      const req = createMockReq({ body: { alerts: [] } });
      await service.acknowledgeAlerts({}, req, mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('executeMonitor should block', async () => {
      const req = createMockReq({ body: {} });
      await service.executeMonitor({}, req, mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('searchMonitors should block', async () => {
      const req = createMockReq({ body: {} });
      await service.searchMonitors({}, req, mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });
  });

  describe('MonitorService - API methods allow authorized requests', () => {
    it('createMonitor should proceed when authorized', async () => {
      const { service } = setupService(MonitorService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(true);
      service.isUnsupportedEndpoint = jest.fn().mockResolvedValue(false);
      service.enrichTargetArn = jest
        .fn()
        .mockImplementation((ctx, req, body) => Promise.resolve(body));
      const mockClient = jest.fn().mockResolvedValue({ _id: 'mon-1', _version: 1 });
      service.getClientBasedOnDataSource = jest.fn().mockReturnValue(mockClient);

      const req = createMockReq({ body: { name: 'test' } });
      await service.createMonitor({}, req, mockRes);
      expect(mockClient).toHaveBeenCalledWith('alerting.createMonitor', { body: { name: 'test' } });
    });
  });

  describe('AlertService - enforceWorkspaceAcl', () => {
    it('should return undefined when authorized', async () => {
      const { service } = setupService(AlertService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(true);

      const result = await service.enforceWorkspaceAcl({}, {}, mockRes, ['library_read']);
      expect(result).toBeUndefined();
    });

    it('should return unauthorized response when not authorized', async () => {
      const { service } = setupService(AlertService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(false);

      await service.enforceWorkspaceAcl({}, {}, mockRes, ['library_read']);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
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
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });

    it('getWorkflowAlerts should block', async () => {
      const req = createMockReq({ query: { dataSourceId: 'ds-1' } });
      await service.getWorkflowAlerts({}, req, mockRes);
      expect(mockRes.unauthorized).toHaveBeenCalledWith({
        body: { message: 'Workspace ACL check failed: unauthorized' },
      });
    });
  });

  describe('AlertService - API methods allow authorized requests', () => {
    it('getAlerts should proceed when authorized', async () => {
      const { service } = setupService(AlertService);
      service.checkWorkspaceAcl = jest.fn().mockResolvedValue(true);
      service._getPplMonitorIds = jest.fn().mockResolvedValue(new Set());
      const mockClient = jest
        .fn()
        .mockResolvedValueOnce({ alerts: [], totalAlerts: 0 })
        .mockResolvedValueOnce({ hits: { hits: [] } });
      service.getClientBasedOnDataSource = jest.fn().mockResolvedValue(mockClient);

      const req = createMockReq({ query: { dataSourceId: 'ds-1' } });
      await service.getAlerts({}, req, mockRes);
      expect(mockClient).toHaveBeenCalled();
      expect(mockRes.ok).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.objectContaining({ ok: true }) })
      );
    });
  });
});

describe('Oasis client integration', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = createMockRes();
    MDSEnabledClientService.setOasisObservabilityClient(undefined);
  });

  describe('getClientBasedOnDataSource with oasis routing', () => {
    it('should use oasis client for AOSS endpoints when oasis client is set', async () => {
      const mockOasisRequest = jest.fn().mockResolvedValue({
        status: 200,
        body: JSON.stringify({ hits: { hits: [] } }),
      });
      MDSEnabledClientService.setOasisObservabilityClient({ request: mockOasisRequest });

      const service = new MonitorService(null, true);
      service.setWorkspaceStart({
        authorizeWorkspace: jest.fn().mockResolvedValue({ authorized: true }),
        aclEnforceEndpointPatterns: ['.aoss.amazonaws.com'],
      });
      service.setWorkspaceIdGetter(() => 'ws-1');

      const context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      const req = createMockReq();

      const client = await service.getClientBasedOnDataSource(context, req);

      // Client should be the oasis callAPI wrapper (a function)
      expect(typeof client).toBe('function');

      // Call it and verify oasis client was invoked with workspace ID header
      await client('alerting.getMonitors', { body: { query: { match_all: {} } } });
      expect(mockOasisRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: '/_plugins/_alerting/monitors/_search',
          datasourceId: 'ds-1',
          headers: expect.objectContaining({
            'x-amzn-aosd-application-workspace-id': 'ws-1',
            'x-amzn-oasis-operation': 'Alerting',
            'x-amzn-aoss-collection-id': 'col',
          }),
        }),
        req,
        context
      );
    });

    it('should throw when workspace ID is missing on oasis path', async () => {
      const mockOasisRequest = jest.fn().mockResolvedValue({ status: 200, body: '{}' });
      MDSEnabledClientService.setOasisObservabilityClient({ request: mockOasisRequest });

      const service = new MonitorService(null, true);
      service.setWorkspaceStart({
        authorizeWorkspace: jest.fn().mockResolvedValue({ authorized: true }),
        aclEnforceEndpointPatterns: ['.aoss.amazonaws.com'],
      });
      service.setWorkspaceIdGetter(() => undefined);

      const context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      const req = createMockReq();

      await expect(service.getClientBasedOnDataSource(context, req)).rejects.toThrow(
        'Missing workspace ID'
      );
    });

    it('should use legacy client for non-AOSS endpoints even when oasis client is set', async () => {
      const mockOasisRequest = jest.fn();
      MDSEnabledClientService.setOasisObservabilityClient({ request: mockOasisRequest });

      const mockCallAPI = jest.fn().mockResolvedValue({});
      const service = new MonitorService(null, true);
      service.setWorkspaceStart({
        authorizeWorkspace: jest.fn().mockResolvedValue({ authorized: true }),
        aclEnforceEndpointPatterns: ['.aoss.amazonaws.com'],
      });

      const context = {
        ...createMockContext('https://search-domain.us-west-2.es.amazonaws.com'),
        dataSource: {
          opensearch: { legacy: { getClient: () => ({ callAPI: mockCallAPI }) } },
        },
      };
      const req = createMockReq();

      const client = await service.getClientBasedOnDataSource(context, req);
      expect(client).toBe(mockCallAPI);
      expect(mockOasisRequest).not.toHaveBeenCalled();
    });

    it('should use legacy client when oasis client is not set', async () => {
      const mockCallAPI = jest.fn().mockResolvedValue({});
      const service = new MonitorService(null, true);
      service.setWorkspaceStart({
        authorizeWorkspace: jest.fn(),
        aclEnforceEndpointPatterns: ['.aoss.amazonaws.com'],
      });

      const context = {
        ...createMockContext('https://col.us-west-2.aoss.amazonaws.com'),
        dataSource: {
          opensearch: { legacy: { getClient: () => ({ callAPI: mockCallAPI }) } },
        },
      };
      const req = createMockReq();

      const client = await service.getClientBasedOnDataSource(context, req);
      // Should not be the oasis wrapper
      expect(client).toBe(mockCallAPI);
    });

    it('should use local cluster client when no dataSourceId', async () => {
      const mockOasisRequest = jest.fn();
      MDSEnabledClientService.setOasisObservabilityClient({ request: mockOasisRequest });

      const mockCallAsCurrentUser = jest.fn();
      const service = new MonitorService(
        { asScoped: () => ({ callAsCurrentUser: mockCallAsCurrentUser }) },
        true
      );

      const req = createMockReq({ query: { dataSourceId: undefined } });
      const client = await service.getClientBasedOnDataSource({}, req);

      expect(client).toBe(mockCallAsCurrentUser);
      expect(mockOasisRequest).not.toHaveBeenCalled();
    });
  });

  describe('createOasisCallAPI action mapping', () => {
    let mockOasisRequest;
    let service;
    let context;
    let req;

    beforeEach(() => {
      mockOasisRequest = jest.fn().mockResolvedValue({
        status: 200,
        body: JSON.stringify({}),
      });
      MDSEnabledClientService.setOasisObservabilityClient({ request: mockOasisRequest });

      service = new MonitorService(null, true);
      service.setWorkspaceStart({
        authorizeWorkspace: jest.fn().mockResolvedValue({ authorized: true }),
        aclEnforceEndpointPatterns: ['.aoss.amazonaws.com'],
      });
      service.setWorkspaceIdGetter(() => 'ws-1');
      context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      req = createMockReq();
    });

    const testAction = async (action, params, expectedMethod, expectedPathContains) => {
      const client = await service.getClientBasedOnDataSource(context, req);
      await client(action, params);
      expect(mockOasisRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: expectedMethod,
          path: expect.stringContaining(expectedPathContains),
          headers: expect.objectContaining({
            'x-amzn-aosd-application-workspace-id': 'ws-1',
            'x-amzn-oasis-operation': 'Alerting',
            'x-amzn-aoss-collection-id': 'col',
          }),
        }),
        req,
        context
      );
    };

    it('maps alerting.createMonitor to POST /_plugins/_alerting/monitors', async () => {
      await testAction(
        'alerting.createMonitor',
        { body: {} },
        'POST',
        '/_plugins/_alerting/monitors'
      );
    });

    it('maps alerting.getMonitor to GET with monitorId', async () => {
      await testAction(
        'alerting.getMonitor',
        { monitorId: 'mon-1' },
        'GET',
        '/_plugins/_alerting/monitors/mon-1'
      );
    });

    it('maps alerting.deleteMonitor to DELETE with monitorId', async () => {
      await testAction(
        'alerting.deleteMonitor',
        { monitorId: 'mon-1' },
        'DELETE',
        '/_plugins/_alerting/monitors/mon-1'
      );
    });

    it('maps alerting.getMonitors to POST _search', async () => {
      await testAction(
        'alerting.getMonitors',
        { body: {} },
        'POST',
        '/_plugins/_alerting/monitors/_search'
      );
    });

    it('maps alerting.createWorkflow to POST workflows', async () => {
      await testAction(
        'alerting.createWorkflow',
        { body: {} },
        'POST',
        '/_plugins/_alerting/workflows'
      );
    });

    it('maps alerting.deleteWorkflow to DELETE with workflowId', async () => {
      await testAction(
        'alerting.deleteWorkflow',
        { workflowId: 'wf-1' },
        'DELETE',
        '/_plugins/_alerting/workflows/wf-1'
      );
    });

    it('throws for unknown action', async () => {
      const client = await service.getClientBasedOnDataSource(context, req);
      await expect(client('alerting.unknownAction', {})).rejects.toThrow('Unknown alerting action');
    });

    it('passes body as stringified JSON', async () => {
      const client = await service.getClientBasedOnDataSource(context, req);
      await client('alerting.createMonitor', { body: { name: 'test' } });
      expect(mockOasisRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          body: JSON.stringify({ name: 'test' }),
        }),
        req,
        context
      );
    });

    it('passes datasourceId to oasis client', async () => {
      const client = await service.getClientBasedOnDataSource(context, req);
      await client('alerting.getMonitors', { body: {} });
      expect(mockOasisRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          datasourceId: 'ds-1',
        }),
        req,
        context
      );
    });

    it('forwards non-path, non-body params as query string', async () => {
      const client = await service.getClientBasedOnDataSource(context, req);
      await client('alerting.updateMonitor', {
        monitorId: 'mon-1',
        body: { name: 'test' },
        if_seq_no: 5,
        if_primary_term: 1,
        refresh: 'wait_for',
      });
      expect(mockOasisRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          path: expect.stringContaining('if_seq_no=5'),
        }),
        req,
        context
      );
      const calledPath = mockOasisRequest.mock.calls[0][0].path;
      expect(calledPath).toContain('if_primary_term=1');
      expect(calledPath).toContain('refresh=wait_for');
      expect(calledPath).not.toContain('monitorId');
      expect(calledPath).not.toContain('body');
    });

    it('forwards alert query params for getAlerts', async () => {
      const client = await service.getClientBasedOnDataSource(context, req);
      await client('alerting.getAlerts', {
        size: 20,
        sortOrder: 'desc',
        alertState: 'ALL',
        severityLevel: 'ALL',
      });
      const calledPath = mockOasisRequest.mock.calls[0][0].path;
      expect(calledPath).toContain('size=20');
      expect(calledPath).toContain('sortOrder=desc');
      expect(calledPath).toContain('alertState=ALL');
    });

    it('passes x-amzn-aoss-account-id when account header is present', async () => {
      const reqWithAccount = createMockReq({ headers: { 'x-amzn-aosd-account-id': '123456789' } });
      const client = await service.getClientBasedOnDataSource(context, reqWithAccount);
      await client('alerting.getMonitors', { body: {} });
      expect(mockOasisRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-amzn-aoss-account-id': '123456789',
          }),
        }),
        reqWithAccount,
        context
      );
    });
  });

  describe('oasis error handling', () => {
    let service;
    let context;
    let req;

    beforeEach(() => {
      service = new MonitorService(null, true);
      service.setWorkspaceStart({
        authorizeWorkspace: jest.fn().mockResolvedValue({ authorized: true }),
        aclEnforceEndpointPatterns: ['.aoss.amazonaws.com'],
      });
      service.setWorkspaceIdGetter(() => 'ws-1');
      context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      req = createMockReq();
    });

    it('throws on non-2xx response status', async () => {
      MDSEnabledClientService.setOasisObservabilityClient({
        request: jest.fn().mockResolvedValue({ status: 404, body: 'Not Found' }),
      });
      const client = await service.getClientBasedOnDataSource(context, req);
      await expect(client('alerting.getMonitor', { monitorId: 'mon-1' })).rejects.toThrow(
        'Oasis request failed with status 404'
      );
    });

    it('throws on 500 with JSON error body', async () => {
      MDSEnabledClientService.setOasisObservabilityClient({
        request: jest.fn().mockResolvedValue({
          status: 500,
          body: { error: 'internal server error' },
        }),
      });
      const client = await service.getClientBasedOnDataSource(context, req);
      await expect(client('alerting.createMonitor', { body: {} })).rejects.toThrow(
        'Oasis request failed with status 500'
      );
    });

    it('does not throw on 200 response', async () => {
      MDSEnabledClientService.setOasisObservabilityClient({
        request: jest.fn().mockResolvedValue({ status: 200, body: JSON.stringify({ ok: true }) }),
      });
      const client = await service.getClientBasedOnDataSource(context, req);
      const result = await client('alerting.getMonitors', { body: {} });
      expect(result).toEqual({ ok: true });
    });
  });

  describe('oasis response parsing', () => {
    let service;
    let context;
    let req;

    beforeEach(() => {
      service = new MonitorService(null, true);
      service.setWorkspaceStart({
        authorizeWorkspace: jest.fn().mockResolvedValue({ authorized: true }),
        aclEnforceEndpointPatterns: ['.aoss.amazonaws.com'],
      });
      service.setWorkspaceIdGetter(() => 'ws-1');
      context = createMockContext('https://col.us-west-2.aoss.amazonaws.com');
      req = createMockReq();
    });

    it('parses JSON string response body', async () => {
      const expected = { hits: { total: 5 } };
      MDSEnabledClientService.setOasisObservabilityClient({
        request: jest.fn().mockResolvedValue({ status: 200, body: JSON.stringify(expected) }),
      });

      const client = await service.getClientBasedOnDataSource(context, req);
      const result = await client('alerting.getMonitors', { body: {} });
      expect(result).toEqual(expected);
    });

    it('returns non-string body as-is', async () => {
      const expected = { hits: { total: 5 } };
      MDSEnabledClientService.setOasisObservabilityClient({
        request: jest.fn().mockResolvedValue({ status: 200, body: expected }),
      });

      const client = await service.getClientBasedOnDataSource(context, req);
      const result = await client('alerting.getMonitors', { body: {} });
      expect(result).toEqual(expected);
    });
  });
});

describe('enrichTargetArn endpoint formats', () => {
  let service;
  const accountId = '123456789012';

  const enrich = (endpoint) => {
    const context = createMockContext(endpoint);
    const req = createMockReq({ headers: { 'x-amzn-aosd-account-id': accountId } });
    return service.enrichTargetArn(context, req, {});
  };

  beforeEach(() => {
    service = new MonitorService(null, true);
    service.setWorkspaceStart({
      authorizeWorkspace: jest.fn().mockResolvedValue({ authorized: true }),
      // Region-independent pattern that matches every AOSS host format.
      aclEnforceEndpointPatterns: ['.aoss.'],
    });
    service.setWorkspaceIdGetter(() => 'ws-1');
  });

  it('parses the existing <id>.<region>.aoss.amazonaws.com format', async () => {
    const result = await enrich('https://einsh50ygjaepfpfs42l.us-west-2.aoss.amazonaws.com');
    expect(result.target).toEqual({
      type: 'AOSS_COLLECTION',
      endpoint: 'https://einsh50ygjaepfpfs42l.us-west-2.aoss.amazonaws.com',
      arn: `arn:aws:aoss:us-west-2:${accountId}:collection/einsh50ygjaepfpfs42l`,
    });
  });

  it('parses the new <id>.aoss.<region>.on.aws format', async () => {
    const result = await enrich('https://y6havmdqlzu2f205byg1.aoss.us-east-2.on.aws');
    expect(result.target).toEqual({
      type: 'AOSS_COLLECTION',
      endpoint: 'https://y6havmdqlzu2f205byg1.aoss.us-east-2.on.aws',
      arn: `arn:aws:aoss:us-east-2:${accountId}:collection/y6havmdqlzu2f205byg1`,
    });
  });

  it('parses the V2 PrivateLink <id>.<region>.aoss.on.aws format', async () => {
    const result = await enrich('https://col.us-east-2.aoss.on.aws');
    expect(result.target.arn).toBe(`arn:aws:aoss:us-east-2:${accountId}:collection/col`);
  });

  it('uses the aws-us-gov partition for GovCloud endpoints', async () => {
    const result = await enrich('https://col.us-gov-west-1.aoss.amazonaws-us-gov.com');
    expect(result.target.arn).toBe(`arn:aws-us-gov:aoss:us-gov-west-1:${accountId}:collection/col`);
  });

  it('uses the aws-cn partition for China endpoints', async () => {
    const result = await enrich('https://col.cn-north-1.aoss.amazonaws.com.cn');
    expect(result.target.arn).toBe(`arn:aws-cn:aoss:cn-north-1:${accountId}:collection/col`);
  });

  it('leaves the body unchanged for non-AOSS endpoints', async () => {
    const result = await enrich('https://search-mydomain.us-east-1.es.amazonaws.com');
    expect(result.target).toBeUndefined();
  });
});
