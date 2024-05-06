import { getDataSourceEnabled, getDataSource } from '../../services/services';

export function createQueryObject() {
  const dataSourceEnabled = getDataSourceEnabled().enabled === true;
  const landingDataSourceId = dataSourceEnabled ? getDataSource().dataSourceId : undefined;

  // Only include query object if data source is enabled
  return dataSourceEnabled ? { dataSourceId: landingDataSourceId } : undefined;
}
