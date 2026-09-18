/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';

import { CrossClusterConfiguration } from './CrossClusterConfiguration';
import { httpClientMock } from '../../../../../../test/mocks';

const runAllPromises = () => new Promise(setImmediate);

function getShallowWrapper(customProps = {}) {
  return shallow(
    <CrossClusterConfiguration
      httpClient={httpClientMock}
      formik={{ values: {} }}
      monitorType="query_level_monitor"
      {...customProps}
    />,
    // Skip componentDidMount so getIndexes() does not fire before we set up mocks.
    { disableLifecycleMethods: true }
  );
}

describe('CrossClusterConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    httpClientMock.get.mockResolvedValue({ ok: true, resp: {} });
    httpClientMock.post.mockResolvedValue({ ok: true, resp: [] });
  });

  describe('getLocalDataStreams', () => {
    test('posts to the data streams endpoint and returns the resolved data streams', async () => {
      httpClientMock.post.mockResolvedValue({
        ok: true,
        resp: [{ index: 'repro-ds-logs', health: 'green', status: 'open' }],
      });
      const instance = getShallowWrapper().instance();

      const result = await instance.getLocalDataStreams();

      expect(httpClientMock.post).toHaveBeenCalledWith(
        '../api/alerting/_data_streams',
        expect.objectContaining({ body: JSON.stringify({ dataStream: '*' }) })
      );
      expect(result).toEqual([{ index: 'repro-ds-logs', health: 'green', status: 'open' }]);
    });

    test('returns an empty array when the response is not ok', async () => {
      httpClientMock.post.mockResolvedValue({ ok: false });
      const instance = getShallowWrapper().instance();

      expect(await instance.getLocalDataStreams()).toEqual([]);
    });

    test('returns an empty array when the request throws', async () => {
      httpClientMock.post.mockRejectedValue(new Error('network'));
      const instance = getShallowWrapper().instance();

      expect(await instance.getLocalDataStreams()).toEqual([]);
    });
  });

  describe('parseOptions data stream merge', () => {
    const findClusterGroup = (instance, clusterName) =>
      instance.state.indexOptions.find(
        (group) => typeof group.label === 'string' && group.label.includes(clusterName)
      );

    test('merges local (hub) cluster data streams into the index options', () => {
      const instance = getShallowWrapper().instance();
      instance.setState({ selectedClusters: [{ cluster: 'local-cluster', hub_cluster: true }] });

      instance.parseOptions(
        {
          'local-cluster': {
            cluster: 'local-cluster',
            hub_cluster: true,
            health: 'green',
            indexes: { idx1: { name: 'idx1', health: 'green' } },
          },
        },
        [{ index: 'repro-ds-logs', health: 'green', status: 'open' }]
      );

      const options = findClusterGroup(instance, 'local-cluster').options.map((o) => o.index);
      expect(options).toContain('idx1');
      expect(options).toContain('repro-ds-logs');
    });

    test('does not add data streams to remote clusters', () => {
      const instance = getShallowWrapper().instance();
      instance.setState({ selectedClusters: [{ cluster: 'remote1', hub_cluster: false }] });

      instance.parseOptions(
        {
          remote1: {
            cluster: 'remote1',
            hub_cluster: false,
            health: 'green',
            indexes: { ridx: { name: 'ridx', health: 'green' } },
          },
        },
        [{ index: 'repro-ds-logs', health: 'green', status: 'open' }]
      );

      const options = findClusterGroup(instance, 'remote1').options.map((o) => o.index);
      expect(options).toEqual(['ridx']);
      expect(options).not.toContain('repro-ds-logs');
    });

    test('dedupes a data stream that already appears as an index', () => {
      const instance = getShallowWrapper().instance();
      instance.setState({ selectedClusters: [{ cluster: 'local-cluster', hub_cluster: true }] });

      instance.parseOptions(
        {
          'local-cluster': {
            cluster: 'local-cluster',
            hub_cluster: true,
            health: 'green',
            indexes: { 'repro-ds-logs': { name: 'repro-ds-logs', health: 'green' } },
          },
        },
        [{ index: 'repro-ds-logs', health: 'green', status: 'open' }]
      );

      const matches = findClusterGroup(instance, 'local-cluster').options.filter(
        (o) => o.index === 'repro-ds-logs'
      );
      expect(matches).toHaveLength(1);
    });

    test('is a no-op when there are no data streams', () => {
      const instance = getShallowWrapper().instance();
      instance.setState({ selectedClusters: [{ cluster: 'local-cluster', hub_cluster: true }] });

      instance.parseOptions(
        {
          'local-cluster': {
            cluster: 'local-cluster',
            hub_cluster: true,
            health: 'green',
            indexes: { idx1: { name: 'idx1', health: 'green' } },
          },
        },
        []
      );

      const options = findClusterGroup(instance, 'local-cluster').options.map((o) => o.index);
      expect(options).toEqual(['idx1']);
    });
  });

  describe('getIndexes', () => {
    test('resolves local data streams and passes them to parseOptions', async () => {
      httpClientMock.get.mockResolvedValue({ ok: true, resp: { some: 'cluster' } });
      httpClientMock.post.mockResolvedValue({
        ok: true,
        resp: [{ index: 'repro-ds-logs', health: 'green', status: 'open' }],
      });
      const instance = getShallowWrapper().instance();
      const parseSpy = jest.spyOn(instance, 'parseOptions').mockImplementation(() => {});

      await instance.getIndexes();
      await runAllPromises();

      expect(httpClientMock.post).toHaveBeenCalledWith(
        '../api/alerting/_data_streams',
        expect.anything()
      );
      expect(parseSpy).toHaveBeenCalledWith({ some: 'cluster' }, [
        { index: 'repro-ds-logs', health: 'green', status: 'open' },
      ]);
    });
  });
});
