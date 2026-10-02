/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Main from './Main';
import {
  getDataSourceMetadata,
  setDataSource,
  setDataSourceEnabled,
  setDataSourceMetadata,
} from '../../services';
import * as helpers from '../../utils/helpers';

describe('Main.refreshLiveDataSourceVersion', () => {
  const makeThis = () => ({ context: { http: {} }, forceUpdate: jest.fn() });

  beforeEach(() => {
    setDataSourceEnabled({ enabled: true });
    setDataSourceMetadata({
      dataSourceVersion: '2.19.0',
      dataSourceEngineType: '',
      dataSourceLabel: 'A',
    });
  });

  // Restore only our own spy: the global test setup spies console.error per test and
  // restores it itself, so a blanket jest.restoreAllMocks() here would break that.
  let fetchSpy;
  afterEach(() => {
    if (fetchSpy) fetchSpy.mockRestore();
    fetchSpy = undefined;
    setDataSourceMetadata(null);
    setDataSourceEnabled({ enabled: false });
  });

  test('applies the live version to the still-selected data source and re-renders', async () => {
    fetchSpy = jest.spyOn(helpers, 'fetchLiveDataSourceVersion').mockResolvedValue('3.7.0');
    setDataSource({ dataSourceId: 'ds-a' });
    const self = makeThis();

    await Main.prototype.refreshLiveDataSourceVersion.call(self, 'ds-a');

    expect(getDataSourceMetadata().dataSourceVersion).toBe('3.7.0');
    expect(getDataSourceMetadata().dataSourceLabel).toBe('A');
    expect(self.forceUpdate).toHaveBeenCalledTimes(1);
  });

  test('drops a late answer once the user has switched to another data source', async () => {
    fetchSpy = jest.spyOn(helpers, 'fetchLiveDataSourceVersion').mockResolvedValue('3.7.0');
    // The fetch was issued for ds-a, but by the time it answers ds-b is selected.
    setDataSource({ dataSourceId: 'ds-b' });
    setDataSourceMetadata({ dataSourceVersion: '2.19.0', dataSourceLabel: 'B' });
    const self = makeThis();

    await Main.prototype.refreshLiveDataSourceVersion.call(self, 'ds-a');

    expect(getDataSourceMetadata()).toEqual({ dataSourceVersion: '2.19.0', dataSourceLabel: 'B' });
    expect(self.forceUpdate).not.toHaveBeenCalled();
  });

  test('leaves the saved version alone when the route cannot answer', async () => {
    fetchSpy = jest.spyOn(helpers, 'fetchLiveDataSourceVersion').mockResolvedValue('');
    setDataSource({ dataSourceId: 'ds-a' });
    const self = makeThis();

    await Main.prototype.refreshLiveDataSourceVersion.call(self, 'ds-a');

    expect(getDataSourceMetadata().dataSourceVersion).toBe('2.19.0');
    expect(self.forceUpdate).not.toHaveBeenCalled();
  });
});
