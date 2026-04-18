import { RequestHandlerContext, OpenSearchDashboardsRequest, OpenSearchDashboardsResponseFactory, ILegacyCustomClusterClient } from '../../../../src/core/server';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const alertingConfig = require('../alerting_configs.json');

const WS_ACL_ENDPOINT_PATTERNS: string[] = alertingConfig['ws.acl.enforce.endpoint.patterns'] || [];

interface WorkspaceAuthorizer {
  authorizeWorkspace: (
    request: OpenSearchDashboardsRequest,
    workspaceIds: string[],
    permissionModes?: string[]
  ) => Promise<{ authorized: true } | { authorized: false; unauthorizedWorkspaces: string[] }>;
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

  protected getClientBasedOnDataSource(context: RequestHandlerContext, request: OpenSearchDashboardsRequest) {
    const dataSourceId = (request.query as any).dataSourceId;
    return this.dataSourceEnabled && dataSourceId
      ? context.dataSource.opensearch.legacy.getClient(dataSourceId.toString()).callAPI
      : this.osDriver.asScoped(request).callAsCurrentUser;
  }

  protected async enforceWorkspaceAcl(context: RequestHandlerContext, request: OpenSearchDashboardsRequest, res: OpenSearchDashboardsResponseFactory, permissionModes: string[] = ['read']) {
    const authorized = await this.checkWorkspaceAcl(context, request, permissionModes);
    if (!authorized) {
      return res.unauthorized({ body: { message: 'Workspace ACL check failed: unauthorized' } });
    }
    return undefined;
  }

  protected async checkWorkspaceAcl(context: RequestHandlerContext, request: OpenSearchDashboardsRequest, permissionModes: string[] = ['read']): Promise<boolean> {
    const dataSourceId = (request.query as any).dataSourceId;
    if (!dataSourceId) {
      return true;
    }

    const savedObjectsClient = context.core.savedObjects.client;
    const dataSource = await savedObjectsClient.get('data-source', dataSourceId.toString());
    const endpoint = (dataSource.attributes as any).endpoint as string;

    const requiresAcl = WS_ACL_ENDPOINT_PATTERNS.some((pattern) => endpoint.includes(pattern));
    if (!requiresAcl) {
      return true;
    }

    const workspaceId = this.workspaceIdGetter?.(request);

    if (!workspaceId || !this.workspaceStart) {
      return true;
    }

    const result = await this.workspaceStart.authorizeWorkspace(request, [workspaceId], permissionModes);
    return result.authorized;
  }
}
