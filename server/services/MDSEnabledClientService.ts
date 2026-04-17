import { RequestHandlerContext, OpenSearchDashboardsRequest, ILegacyCustomClusterClient, Logger } from '../../../../src/core/server';

interface WorkspaceAuthorizer {
  authorizeWorkspace: (
    request: OpenSearchDashboardsRequest,
    workspaceIds: string[],
    principal: string,
    permissionModes?: string[]
  ) => Promise<{ authorized: boolean; unauthorizedWorkspaces?: string[] }>;
}

export abstract class MDSEnabledClientService {
  private workspaceStart?: WorkspaceAuthorizer;
  private logger?: Logger;
  private workspaceIdGetter?: (request: OpenSearchDashboardsRequest) => string | undefined;

  constructor(private osDriver: ILegacyCustomClusterClient, private dataSourceEnabled: boolean) {}

  public setWorkspaceStart(workspaceStart: WorkspaceAuthorizer) {
    this.workspaceStart = workspaceStart;
  }

  public setWorkspaceIdGetter(fn: (request: OpenSearchDashboardsRequest) => string | undefined) {
    this.workspaceIdGetter = fn;
  }

  public setLogger(logger: Logger) {
    this.logger = logger;
  }

  protected getClientBasedOnDataSource(context: RequestHandlerContext, request: OpenSearchDashboardsRequest) {
    const dataSourceId = (request.query as any).dataSourceId;
    return this.dataSourceEnabled && dataSourceId
      ? context.dataSource.opensearch.legacy.getClient(dataSourceId.toString()).callAPI
      : this.osDriver.asScoped(request).callAsCurrentUser;
  }

  protected async checkWorkspaceAcl(context: RequestHandlerContext, request: OpenSearchDashboardsRequest, permissionModes: string[] = ['read']): Promise<boolean> {
    // Only run workspace ACL check for serverless (AOSS) data sources
    const dataSourceId = (request.query as any).dataSourceId;
    if (dataSourceId) {
      const savedObjectsClient = context.core.savedObjects.client;
      const dataSource = await savedObjectsClient.get('data-source', dataSourceId.toString());
      const endpoint = (dataSource.attributes as any).endpoint as string;
      if (!endpoint.includes('.aoss.amazonaws.com')) {
        return true;
      }
    } else {
      return true;
    }

    const principal = request.headers['x-amzn-aosd-username'] as string;
    const workspaceId = this.workspaceIdGetter?.(request);

    if (!principal || !workspaceId || !this.workspaceStart) {
      return true;
    }

    const result = await this.workspaceStart.authorizeWorkspace(request, [workspaceId], principal, permissionModes);
    this.logger?.info(`Workspace ACL check: workspace=${workspaceId}, authorized=${result.authorized}, permissionModes=${permissionModes.join(',')}`);
    return result.authorized;
  }
}
