import { getDataSourceEnabled, getDataSource } from '../../services/services';
import _ from 'lodash';

export function dataSourceEnabled() {
  return getDataSourceEnabled()?.enabled === true;
}

export function getDataSourceQueryObj() {
  const dataSourceQuery = dataSourceEnabled()
    ? { dataSourceId: getDataSource()?.dataSourceId }
    : undefined;
  const options = dataSourceQuery ? { query: dataSourceQuery } : undefined;
  return options;
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
  var params = {};
  var queryParams = queryString.substring(1).split('&');
  for (var i = 0; i < queryParams.length; i++) {
    var pair = queryParams[i].split('=');
    params[pair[0]] = pair[1];
  }
  return params.hasOwnProperty('dataSourceId') ? params['dataSourceId'] : undefined;
}

export function constructUrlFromDataSource(url) {
  const dataSourceId = getDataSource()?.dataSourceId;
  return dataSourceEnabled() && dataSourceId ? url + `&dataSourceId=${dataSourceId}` : url;
}
