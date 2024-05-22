/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpFetchQuery, HttpSetup } from '../../../../src/core/public';
import { ChannelItemType, NotificationServerFeatures } from './models/interfaces';
import { configListToChannels, configToChannel } from './utils/helper';
import { getDataSourceQueryObj } from '../pages/utils/helpers';

interface ConfigsResponse {
  total_hits: number;
  config_list: any[];
}

const NODE_API_BASE_PATH = '/api/notifications';
const NODE_API = Object.freeze({
  GET_CONFIGS: `${NODE_API_BASE_PATH}/get_configs`,
  GET_CONFIG: `${NODE_API_BASE_PATH}/get_config`,
  GET_AVAILABLE_FEATURES: `${NODE_API_BASE_PATH}/features`,
});

export default class NotificationService {
  httpClient: HttpSetup;

  constructor(httpClient: HttpSetup) {
    this.httpClient = httpClient;
  }


  getServerFeatures = async (): Promise<NotificationServerFeatures> => {
    const dataSourceQuery = getDataSourceQueryObj();
    try {
      const response = await this.httpClient.get(
        NODE_API.GET_AVAILABLE_FEATURES, dataSourceQuery
      );
      return response as NotificationServerFeatures;
    } catch (error) {
      console.error('error fetching available features', error);
      return {
        availableChannels: {},
        availableConfigTypes: [],
        tooltipSupport: false
      };
    }
  };

  getConfigs = async (queryObject: HttpFetchQuery) => {
    const dataSourceId = getDataSourceQueryObj()?.query?.dataSourceId;
    const extendedParams = {
      ...(dataSourceId !== undefined && { dataSourceId }), // Only include dataSourceId if it exists
      ...queryObject // Other parameters
    };
    return this.httpClient.get<ConfigsResponse>(NODE_API.GET_CONFIGS, {
      query: extendedParams,
    });
  };

  getConfig = async (id: string) => {
    const dataSourceQuery = getDataSourceQueryObj();
    return this.httpClient.get<ConfigsResponse>(`${NODE_API.GET_CONFIG}/${id}`, dataSourceQuery);
  };

  getChannels = async (
    queryObject: HttpFetchQuery // config_type: Object.keys(CHANNEL_TYPE)
  ): Promise<{ items: ChannelItemType[]; total: number }> => {
    const dataSourceId = getDataSourceQueryObj()?.query?.dataSourceId;
    const extendedParams = {
      ...(dataSourceId !== undefined && { dataSourceId }), // Only include dataSourceId if it exists
      ...queryObject // Other parameters
    };
    const response = await this.getConfigs(extendedParams);
    return {
      items: configListToChannels(response.config_list),
      total: response.total_hits || 0,
    };
  };

  getChannel = async (id: string): Promise<ChannelItemType> => {
    const response = await this.getConfig(id);
    return configToChannel(response.config_list[0]);
  };
}
