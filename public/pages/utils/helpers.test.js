/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { constructUrlFromDataSource, getURL, parseQueryStringAndGetDataSource } from './helpers';
import { getDataSource, getDataSourceEnabled } from '../../services/services';

jest.mock('../../services/services', () => ({
  getDataSourceEnabled: jest.fn(),
  getDataSource: jest.fn(),
  getAssistantClient: jest.fn(),
}));

const MONITOR_URL = '#/monitors/monitor_id?&type=query';

describe('getURL', () => {
  test('returns the url untouched when the data source feature is disabled', () => {
    getDataSourceEnabled.mockReturnValue({ enabled: false });
    expect(getURL(MONITOR_URL, undefined)).toBe(MONITOR_URL);
  });

  test('appends the selected data source id', () => {
    getDataSourceEnabled.mockReturnValue({ enabled: true });
    expect(getURL(MONITOR_URL, 'ds_1')).toBe(`${MONITOR_URL}&dataSourceId=ds_1`);
  });

  test('serializes the local cluster as the empty string', () => {
    getDataSourceEnabled.mockReturnValue({ enabled: true });
    expect(getURL(MONITOR_URL, '')).toBe(`${MONITOR_URL}&dataSourceId=`);
  });

  test('never serializes an unresolved selection as the literal string "undefined"', () => {
    getDataSourceEnabled.mockReturnValue({ enabled: true });
    expect(getURL(MONITOR_URL, undefined)).toBe(`${MONITOR_URL}&dataSourceId=`);
    expect(getURL(MONITOR_URL, null)).toBe(`${MONITOR_URL}&dataSourceId=`);
  });

  test('keeps the dataSourceId parameter for an unresolved selection', () => {
    getDataSourceEnabled.mockReturnValue({ enabled: true });
    const search = `?${getURL(MONITOR_URL, undefined).split('?')[1]}`;
    // Main only clears `dataSourceLoading` when the query string carries a dataSourceId, so
    // dropping the parameter would leave the monitor details route unrendered.
    expect(parseQueryStringAndGetDataSource(search)).toBe('');
  });
});

describe('constructUrlFromDataSource', () => {
  test('returns the url untouched when the data source feature is disabled', () => {
    getDataSourceEnabled.mockReturnValue({ enabled: false });
    expect(constructUrlFromDataSource(MONITOR_URL)).toBe(MONITOR_URL);
  });

  test('appends the data source id held by the service', () => {
    getDataSourceEnabled.mockReturnValue({ enabled: true });
    getDataSource.mockReturnValue({ dataSourceId: 'ds_1' });
    expect(constructUrlFromDataSource(MONITOR_URL)).toBe(`${MONITOR_URL}&dataSourceId=ds_1`);
  });

  test('never serializes an unset data source as the literal string "undefined"', () => {
    getDataSourceEnabled.mockReturnValue({ enabled: true });
    getDataSource.mockReturnValue(undefined);
    expect(constructUrlFromDataSource(MONITOR_URL)).toBe(`${MONITOR_URL}&dataSourceId=`);
  });
});
