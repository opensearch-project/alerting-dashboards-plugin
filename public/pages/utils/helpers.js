import { getDataSourceEnabled, getDataSource } from '../../services/services';
import _ from 'lodash';

export function createQueryObject() {
  const dataSourceEnabled = getDataSourceEnabled().enabled === true;
  const landingDataSourceId = dataSourceEnabled ? getDataSource().dataSourceId : undefined;

  // Only include query object if data source is enabled
  return dataSourceEnabled ? { dataSourceId: landingDataSourceId } : undefined;
}

export function isDataSourceChanged(prevProps, currProps) {
  return (
    getDataSourceEnabled().enabled &&
    !_.isEqual(prevProps.landingDataSourceId, currProps.landingDataSourceId)
  );
}
