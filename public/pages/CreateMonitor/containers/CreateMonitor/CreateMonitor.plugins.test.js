/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { shallow } from 'enzyme';
import CreateMonitor from './CreateMonitor';
import { historyMock, httpClientMock } from '../../../../../test/mocks';
import { setupCoreStart } from '../../../../../test/utils/helpers';
import { setDataSourceEnabled } from '../../../../services';
import { OS_AD_PLUGIN } from '../../../../utils/constants';
import { getPlugins } from './utils/helpers';

jest.mock('./utils/helpers', () => ({
  ...jest.requireActual('./utils/helpers'),
  getPlugins: jest.fn(),
}));

const location = { hash: '', pathname: '/create-monitor', search: '', state: undefined };
const match = { isExact: true, params: {}, path: '/create-monitor', url: '/create-monitor' };
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const renderFor = (landingDataSourceId) =>
  shallow(
    <CreateMonitor
      httpClient={httpClientMock}
      history={historyMock}
      setFlyout={jest.fn()}
      match={match}
      location={location}
      landingDataSourceId={landingDataSourceId}
    />
  );

beforeAll(() => setupCoreStart());
beforeEach(() => {
  jest.clearAllMocks();
  setDataSourceEnabled({ enabled: true });
});
afterEach(() => setDataSourceEnabled({ enabled: false }));

describe('CreateMonitor plugins', () => {
  test('looks the plugins up again when the data source changes', async () => {
    getPlugins.mockResolvedValueOnce([OS_AD_PLUGIN]).mockResolvedValueOnce([]);
    const wrapper = renderFor('ds-with-ad');
    await flush();
    expect(wrapper.state('plugins')).toEqual([OS_AD_PLUGIN]);
    wrapper.setProps({ landingDataSourceId: 'ds-without-ad' });
    await flush();
    expect(getPlugins).toHaveBeenCalledTimes(2);
    // The anomaly detector option no longer shows for a data source without AD.
    expect(wrapper.state('plugins')).toEqual([]);
  });

  test("an earlier data source's late answer doesn't replace the current one's", async () => {
    let answerFirst;
    getPlugins
      .mockImplementationOnce(() => new Promise((resolve) => (answerFirst = resolve)))
      .mockResolvedValueOnce([]);
    const wrapper = renderFor('ds-1');
    wrapper.setProps({ landingDataSourceId: 'ds-2' });
    await flush();
    answerFirst([OS_AD_PLUGIN]);
    await flush();
    expect(wrapper.state('plugins')).toEqual([]);
  });
});
