export class MDSEnabledClientService {
  constructor(esDriver, dataSourceEnabled) {
    this.dataSourceEnabled = dataSourceEnabled;
    this.esDriver = esDriver;
  }
  getClientBasedOnDataSource(context, request) {
    const dataSourceId = request.query?.dataSourceId;
    if (this.dataSourceEnabled && dataSourceId && dataSourceId.trim().length !== 0) {
      // Client for remote cluster
      return context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI;
    } else {
      // Fall back to default local cluster
      return this.esDriver.asScoped(request).callAsCurrentUser;
    }
  }
}
