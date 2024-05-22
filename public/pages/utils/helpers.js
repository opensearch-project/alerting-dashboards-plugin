import { getDataSourceEnabled, getDataSource } from '../../services/services';
import _ from 'lodash';

export function dataSourceEnabled() {
  return getDataSourceEnabled()?.enabled === true;
}

export function getDataSourceQueryObj() {
  const dataSourceQuery = dataSourceEnabled()
    ? { dataSourceId: getDataSource()?.dataSourceId }
    : undefined;
  return dataSourceQuery ? { query: dataSourceQuery } : undefined;
}

export function isDataSourceChanged(prevProps, currProps) {
  return (
    dataSourceEnabled() && !_.isEqual(prevProps.landingDataSourceId, currProps.landingDataSourceId)
  );
}

export function getURL(url, dataSourceId) {
  return dataSourceEnabled() ? url + `&dataSourceId=${dataSourceId}` : url;
}

export function parseQueryStringAndGetDataSource(queryString) {
  const params = {};
  const queryParams = queryString.substring(1).split('&');
  for (const param of queryParams) {
    const pair = param.split('=');
    params[pair[0]] = pair[1];
  }
  return params['dataSourceId'];
}

export function constructUrlFromDataSource(url) {
  const dataSourceId = getDataSource()?.dataSourceId;
  return dataSourceEnabled() && dataSourceId ? url + `&dataSourceId=${dataSourceId}` : url;
}
