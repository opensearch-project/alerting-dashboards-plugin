import {
  RequestHandlerContext,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  ILegacyCustomClusterClient,
} from '../../../../src/core/server';
const extractCollectionIdFromEndpoint = (endpoint: string): string | undefined => {
  const match = endpoint.match(/^https?:\/\/([^.]+)\./);
  return match ? match[1] : undefined;
};

interface OasisClient {
  request(
    options: { method: string; path: string; body?: string; datasourceId: string; headers?: Record<string, string> },
    request: OpenSearchDashboardsRequest,
    context: RequestHandlerContext
  ): Promise<{ status: number; body: string | unknown }>;
}

interface WorkspaceAuthorizer {
  authorizeWorkspace: (
    request: OpenSearchDashboardsRequest,
    workspaceIds: string[],
    permissionModes?: string[]
  ) => Promise<{ authorized: true } | { authorized: false; unauthorizedWorkspaces: string[] }>;
  aclEnforceEndpointPatterns: string[];
}

export abstract class MDSEnabledClientService {
  private workspaceStart?: WorkspaceAuthorizer;
  private workspaceIdGetter?: (request: OpenSearchDashboardsRequest) => string | undefined;
  private static oasisObservabilityClient?: OasisClient;

  constructor(private osDriver: ILegacyCustomClusterClient, private dataSourceEnabled: boolean) {}

  public static setOasisObservabilityClient(client: OasisClient) {
    MDSEnabledClientService.oasisObservabilityClient = client;
  }

  public static getOasisObservabilityClient(): OasisClient | undefined {
    return MDSEnabledClientService.oasisObservabilityClient;
  }

  public setWorkspaceStart(workspaceStart: WorkspaceAuthorizer) {
    this.workspaceStart = workspaceStart;
  }

  public setWorkspaceIdGetter(fn: (request: OpenSearchDashboardsRequest) => string | undefined) {
    this.workspaceIdGetter = fn;
  }

  protected get aclEndpointPatterns(): string[] {
    return this.workspaceStart?.aclEnforceEndpointPatterns ?? [];
  }

  protected async enrichTargetArn(context: RequestHandlerContext, req: any, body: any): Promise<any> {
    // If target already has an ARN, skip enrichment
    if (body.target?.arn) return body;

    // Get the endpoint from the data source saved object if not already on the body
    let endpoint = body.target?.endpoint;
    if (!endpoint) {
      endpoint = await this.getDataSourceEndpoint(context, req as OpenSearchDashboardsRequest);
    }
    if (!endpoint) return body;

    // Only enrich endpoints matching an ACL-enforced pattern (AOSS collection)
    if (!this.matchesAclPattern(endpoint)) return body;

    // Derive partition from the endpoint's region/domain so the ARN is correct
    // across commercial, GovCloud, and China. Region-token checks (`-gov-`, `.cn-`)
    // work regardless of which host format or ACL pattern matched.
    let partition = 'aws';
    if (endpoint.includes('-gov-') || endpoint.includes('amazonaws-us-gov')) {
      partition = 'aws-us-gov';
    } else if (endpoint.includes('.cn-') || endpoint.includes('amazonaws.com.cn')) {
      partition = 'aws-cn';
    }

    // Extract collection ID and region from the endpoint. Two host formats exist:
    //   <id>.<region>.aoss.<domain>   (e.g. abc.us-west-2.aoss.amazonaws.com)
    //   <id>.aoss.<region>.<domain>   (e.g. abc.aoss.us-east-2.on.aws)
    const match = endpoint.match(/^https?:\/\/([^.]+)\.(?:([^.]+)\.aoss|aoss\.([^.]+))\./);
    if (!match) return body;
    const collectionId = match[1];
    const region = match[2] || match[3];

    // Account ID from the Neo auth header
    const accountId = req.headers['x-amzn-aosd-account-id'];
    if (!accountId) return body;

    return {
      ...body,
      target: {
        type: 'AOSS_COLLECTION',
        endpoint,
        arn: `arn:${partition}:aoss:${region}:${accountId}:collection/${collectionId}`,
      },
    };
  }

  private async getDataSourceEndpoint(context: RequestHandlerContext, request: OpenSearchDashboardsRequest): Promise<string | undefined> {
    const dataSourceId = (request.query as any).dataSourceId;
    if (!dataSourceId) return undefined;
    const dataSource = await context.core.savedObjects.client.get('data-source', dataSourceId.toString());
    return (dataSource.attributes as any).endpoint as string;
  }

  private matchesAclPattern(endpoint: string): boolean {
    return this.aclEndpointPatterns.some((pattern) => endpoint.includes(pattern));
  }

  protected async getClientBasedOnDataSource(context: RequestHandlerContext, request: OpenSearchDashboardsRequest) {
    const dataSourceId = (request.query as any).dataSourceId;
    if (!this.dataSourceEnabled || !dataSourceId) {
      return this.osDriver.asScoped(request).callAsCurrentUser;
    }

    // Route through oasis for AOSS endpoints
    if (MDSEnabledClientService.oasisObservabilityClient) {
      const endpoint = await this.getDataSourceEndpoint(context, request);
      if (endpoint && this.matchesAclPattern(endpoint)) {
        return this.createOasisCallAPI(request, context, dataSourceId.toString());
      }
    }

    return context.dataSource.opensearch.legacy.getClient(dataSourceId.toString()).callAPI;
  }

  private createOasisCallAPI(request: OpenSearchDashboardsRequest, context: RequestHandlerContext, datasourceId: string) {
    const oasisClient = MDSEnabledClientService.oasisObservabilityClient!;
    const workspaceId = this.workspaceIdGetter?.(request);
    if (!workspaceId) {
      throw new Error('Missing workspace ID');
    }

    return async (action: string, params: any = {}) => {
      const { method, path, pathConsumedKeys } = this.resolveActionToRequest(action, params);
      const body = params.body ? JSON.stringify(params.body) : undefined;

      // Forward remaining params as query string (excluding body and path-consumed keys)
      const excludedKeys = new Set([...pathConsumedKeys, 'body']);
      const queryEntries = Object.entries(params).filter(([key]) => !excludedKeys.has(key));
      let fullPath = path;
      if (queryEntries.length) {
        const qs = queryEntries
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&');
        fullPath += fullPath.includes('?') ? `&${qs}` : `?${qs}`;
      }

      // Build headers required by Oasis/SGW for AOSS collection requests
      const headers: Record<string, string> = {
        'x-amzn-aosd-application-workspace-id': workspaceId,
        'x-amzn-oasis-operation': 'Alerting',
      };

      // Extract collection ID and account ID from the datasource endpoint
      const endpoint = await this.getDataSourceEndpoint(context, request);
      if (endpoint) {
        const collectionId = extractCollectionIdFromEndpoint(endpoint);
        if (collectionId) {
          headers['x-amzn-aoss-collection-id'] = collectionId;
        }
      }

      const accountId = request.headers['x-amzn-aosd-account-id'] as string | undefined;
      if (accountId) {
        headers['x-amzn-aoss-account-id'] = accountId;
      }

      const response = await oasisClient.request(
        { method, path: fullPath, body, datasourceId, headers },
        request,
        context
      );

      // Check for error status to match legacy callAPI contract
      if (response.status && (response.status < 200 || response.status >= 300)) {
        const errorBody = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
        throw new Error(`Oasis request failed with status ${response.status}: ${errorBody}`);
      }

      if ('body' in response && typeof response.body === 'string') {
        return JSON.parse(response.body);
      }
      return response.body;
    };
  }

  private resolveActionToRequest(action: string, params: any): { method: string; path: string; pathConsumedKeys: string[] } {
    const MONITOR_BASE = '/_plugins/_alerting/monitors';
    const WORKFLOW_BASE = '/_plugins/_alerting/workflows';

    switch (action) {
      case 'alerting.createMonitor':
        return { method: 'POST', path: `${MONITOR_BASE}?refresh=wait_for`, pathConsumedKeys: [] };
      case 'alerting.getMonitor':
        return { method: 'GET', path: `${MONITOR_BASE}/${params.monitorId}`, pathConsumedKeys: ['monitorId', 'headers'] };
      case 'alerting.updateMonitor':
        return { method: 'PUT', path: `${MONITOR_BASE}/${params.monitorId}`, pathConsumedKeys: ['monitorId'] };
      case 'alerting.deleteMonitor':
        return { method: 'DELETE', path: `${MONITOR_BASE}/${params.monitorId}`, pathConsumedKeys: ['monitorId'] };
      case 'alerting.getMonitors':
        return { method: 'POST', path: `${MONITOR_BASE}/_search`, pathConsumedKeys: [] };
      case 'alerting.getAlerts':
        return { method: 'GET', path: `${MONITOR_BASE}/alerts`, pathConsumedKeys: [] };
      case 'alerting.executeMonitor':
        return { method: 'POST', path: `${MONITOR_BASE}/_execute?dryrun=${params.dryrun || 'true'}`, pathConsumedKeys: ['dryrun'] };
      case 'alerting.acknowledgeAlerts':
        return { method: 'POST', path: `${MONITOR_BASE}/${params.monitorId}/_acknowledge/alerts`, pathConsumedKeys: ['monitorId'] };
      case 'alerting.createWorkflow':
        return { method: 'POST', path: `${WORKFLOW_BASE}?refresh=wait_for`, pathConsumedKeys: [] };
      case 'alerting.getWorkflow':
        return { method: 'GET', path: `${WORKFLOW_BASE}/${params.monitorId}`, pathConsumedKeys: ['monitorId'] };
      case 'alerting.deleteWorkflow':
        return { method: 'DELETE', path: `${WORKFLOW_BASE}/${params.workflowId}`, pathConsumedKeys: ['workflowId'] };
      case 'alerting.updateWorkflow':
        return { method: 'PUT', path: `${WORKFLOW_BASE}/${params.monitorId}`, pathConsumedKeys: ['monitorId'] };
      case 'alerting.acknowledgeChainedAlerts':
        return { method: 'POST', path: `${WORKFLOW_BASE}/${params.workflowId}/_acknowledge/alerts`, pathConsumedKeys: ['workflowId'] };
      case 'alerting.getWorkflowAlerts':
        return { method: 'GET', path: `${MONITOR_BASE}/alerts`, pathConsumedKeys: [] };
      case 'alerting.searchMonitors':
        return { method: 'POST', path: `${MONITOR_BASE}/_search`, pathConsumedKeys: [] };
      case 'transport.request':
        return { method: (params.method || 'GET').toUpperCase(), path: params.path || '/', pathConsumedKeys: ['method', 'path', 'headers'] };
      default:
        throw new Error(`Unknown alerting action: ${action}`);
    }
  }

  /**
   * Check if the request targets an unsupported endpoint (matching configured patterns).
   * Returns true if the data source endpoint matches any ACL enforcement pattern.
   */
  protected async isUnsupportedEndpoint(context: RequestHandlerContext, request: OpenSearchDashboardsRequest): Promise<boolean> {
    if (!this.aclEndpointPatterns.length) return false;
    try {
      const endpoint = await this.getDataSourceEndpoint(context, request);
      return endpoint ? this.matchesAclPattern(endpoint) : false;
    } catch {
      return false;
    }
  }

  /**
   * Return 501 Not Implemented if the request targets an unsupported endpoint.
   * Use for API operations not supported on serverless.
   */
  protected async rejectIfUnsupported(context: RequestHandlerContext, request: OpenSearchDashboardsRequest, res: OpenSearchDashboardsResponseFactory): Promise<any | undefined> {
    if (await this.isUnsupportedEndpoint(context, request)) {
      return res.custom({
        statusCode: 501,
        body: { message: 'This operation is not supported' },
      });
    }
    return undefined;
  }

  protected async enforceWorkspaceAcl(context: RequestHandlerContext, request: OpenSearchDashboardsRequest, res: OpenSearchDashboardsResponseFactory, permissionModes: string[] = ['read']) {
    const authorized = await this.checkWorkspaceAcl(context, request, permissionModes);
    if (!authorized) {
      return res.unauthorized({ body: { message: 'Workspace ACL check failed: unauthorized' } });
    }
    return undefined;
  }

  private async checkWorkspaceAcl(context: RequestHandlerContext, request: OpenSearchDashboardsRequest, permissionModes: string[] = ['read']): Promise<boolean> {
    const endpoint = await this.getDataSourceEndpoint(context, request);
    if (!endpoint || !this.matchesAclPattern(endpoint)) return true;

    const workspaceId = this.workspaceIdGetter?.(request);
    if (!workspaceId || !this.workspaceStart) return true;

    const result = await this.workspaceStart.authorizeWorkspace(request, [workspaceId], permissionModes);
    return result.authorized;
  }
}
