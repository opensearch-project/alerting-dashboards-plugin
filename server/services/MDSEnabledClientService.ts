import { RequestHandlerContext, OpenSearchDashboardsRequest, OpenSearchDashboardsResponseFactory, ILegacyCustomClusterClient } from '../../../../src/core/server';

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

  constructor(private osDriver: ILegacyCustomClusterClient, private dataSourceEnabled: boolean) {}

  public setWorkspaceStart(workspaceStart: WorkspaceAuthorizer) {
    this.workspaceStart = workspaceStart;
  }

  public setWorkspaceIdGetter(fn: (request: OpenSearchDashboardsRequest) => string | undefined) {
    this.workspaceIdGetter = fn;
  }

  private get aclEndpointPatterns(): string[] {
    return this.workspaceStart?.aclEnforceEndpointPatterns ?? [];
  }

  protected getClientBasedOnDataSource(context: RequestHandlerContext, request: OpenSearchDashboardsRequest) {
    const dataSourceId = (request.query as any).dataSourceId;
    return this.dataSourceEnabled && dataSourceId
      ? context.dataSource.opensearch.legacy.getClient(dataSourceId.toString()).callAPI
      : this.osDriver.asScoped(request).callAsCurrentUser;
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

  protected async checkWorkspaceAcl(context: RequestHandlerContext, request: OpenSearchDashboardsRequest, permissionModes: string[] = ['read']): Promise<boolean> {
    const endpoint = await this.getDataSourceEndpoint(context, request);
    if (!endpoint || !this.matchesAclPattern(endpoint)) return true;

    const workspaceId = this.workspaceIdGetter?.(request);
    if (!workspaceId || !this.workspaceStart) return true;

    const result = await this.workspaceStart.authorizeWorkspace(request, [workspaceId], permissionModes);
    return result.authorized;
  }
}
