import { RequestHandlerContext, OpenSearchDashboardsRequest, ILegacyCustomClusterClient } from '../../../../src/core/server';

export abstract class MDSEnabledClientService {
  constructor(private osDriver: ILegacyCustomClusterClient, private dataSourceEnabled: boolean) {}

  protected getClientBasedOnDataSource(context: RequestHandlerContext, request: OpenSearchDashboardsRequest) {
    const dataSourceId = (request.query as any).dataSourceId;
    return this.dataSourceEnabled && dataSourceId
      ? context.dataSource.opensearch.legacy.getClient(dataSourceId.toString()).callAPI
      : this.osDriver.asScoped(request).callAsCurrentUser;
  }
}
