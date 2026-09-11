/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import NotificationService from './NotificationService';
import { dataSourceEnabled, getDataSourceId } from '../pages/utils/helpers';

jest.mock('../pages/utils/helpers', () => ({
  getDataSourceId: jest.fn(),
  dataSourceEnabled: jest.fn(),
}));

jest.mock('./utils/helper', () => ({
  configListToChannels: jest.fn(() => []),
  configToChannel: jest.fn(),
}));

describe('NotificationService', () => {
  const httpClient = { get: jest.fn() } as any;
  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    httpClient.get.mockResolvedValue({ total_hits: 0, config_list: [] });
    service = new NotificationService(httpClient);
  });

  describe('getConfigs', () => {
    test('sends empty-string dataSourceId for the local cluster when MDS is enabled', async () => {
      (dataSourceEnabled as jest.Mock).mockReturnValue(true);
      (getDataSourceId as jest.Mock).mockReturnValue(undefined); // local cluster

      await service.getConfigs({ from_index: 0 });

      expect(httpClient.get).toHaveBeenCalledWith('/api/notifications/get_configs', {
        query: { dataSourceId: '', from_index: 0 },
      });
    });

    test('sends the selected dataSourceId when one is present', async () => {
      (dataSourceEnabled as jest.Mock).mockReturnValue(true);
      (getDataSourceId as jest.Mock).mockReturnValue('ds-1');

      await service.getConfigs({ from_index: 0 });

      expect(httpClient.get).toHaveBeenCalledWith('/api/notifications/get_configs', {
        query: { dataSourceId: 'ds-1', from_index: 0 },
      });
    });

    test('omits dataSourceId entirely when MDS is disabled', async () => {
      (dataSourceEnabled as jest.Mock).mockReturnValue(false);
      (getDataSourceId as jest.Mock).mockReturnValue(undefined);

      await service.getConfigs({ from_index: 0 });

      expect(httpClient.get).toHaveBeenCalledWith('/api/notifications/get_configs', {
        query: { from_index: 0 },
      });
    });
  });

  describe('getServerFeatures', () => {
    test('sends empty-string dataSourceId for the local cluster when MDS is enabled', async () => {
      (dataSourceEnabled as jest.Mock).mockReturnValue(true);
      (getDataSourceId as jest.Mock).mockReturnValue(undefined); // local cluster
      httpClient.get.mockResolvedValue({
        availableChannels: { slack: 'Slack' },
        availableConfigTypes: ['slack'],
        tooltipSupport: true,
      });

      await service.getServerFeatures();

      expect(httpClient.get).toHaveBeenCalledWith('/api/notifications/features', {
        query: { dataSourceId: '' },
      });
    });

    test('omits the query entirely when MDS is disabled', async () => {
      (dataSourceEnabled as jest.Mock).mockReturnValue(false);
      (getDataSourceId as jest.Mock).mockReturnValue(undefined);
      httpClient.get.mockResolvedValue({
        availableChannels: {},
        availableConfigTypes: [],
        tooltipSupport: false,
      });

      await service.getServerFeatures();

      expect(httpClient.get).toHaveBeenCalledWith('/api/notifications/features', undefined);
    });
  });

  describe('getConfig', () => {
    test('sends empty-string dataSourceId for the local cluster when MDS is enabled', async () => {
      (dataSourceEnabled as jest.Mock).mockReturnValue(true);
      (getDataSourceId as jest.Mock).mockReturnValue(undefined); // local cluster

      await service.getConfig('abc');

      expect(httpClient.get).toHaveBeenCalledWith('/api/notifications/get_config/abc', {
        query: { dataSourceId: '' },
      });
    });
  });

  describe('getChannels', () => {
    test('forwards through getConfigs with the local-cluster dataSourceId under MDS', async () => {
      (dataSourceEnabled as jest.Mock).mockReturnValue(true);
      (getDataSourceId as jest.Mock).mockReturnValue(undefined); // local cluster

      const result = await service.getChannels({ config_type: 'slack' });

      expect(httpClient.get).toHaveBeenCalledWith('/api/notifications/get_configs', {
        query: { dataSourceId: '', config_type: 'slack' },
      });
      expect(result).toEqual({ items: [], total: 0 });
    });
  });
});
