/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpFetchQuery, HttpSetup } from '../../../../src/core/public';
import { ChannelItemType, NotificationServerFeatures } from './models/interfaces';
import { configListToChannels, configToChannel } from './utils/helper';
import { getDataSourceId, dataSourceEnabled } from '../pages/utils/helpers';

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

  // Under MDS the notifications server requires a dataSourceId. The local cluster is the
  // empty string, which getDataSourceId() normalizes to undefined, so fall back to '' rather
  // than omitting the param (as getDataSourceQueryObj would), which the server rejects with 400.
  private getDataSourceQuery = () =>
    dataSourceEnabled() ? { query: { dataSourceId: getDataSourceId() ?? '' } } : undefined;

  getServerFeatures = async (): Promise<NotificationServerFeatures> => {
    const dataSourceQuery = this.getDataSourceQuery();
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
    const dataSourceId = getDataSourceId();
    const extendedParams = {
      // When MDS is enabled the notifications server requires a dataSourceId. The local
      // cluster is represented by the empty string, which getDataSourceId() normalizes to
      // undefined, so fall back to '' rather than omitting the param (which would 400).
      ...(dataSourceEnabled() ? { dataSourceId: dataSourceId ?? '' } : {}),
      ...queryObject // Other parameters
    };
    return this.httpClient.get<ConfigsResponse>(NODE_API.GET_CONFIGS, {
      query: extendedParams,
    });
  };

  getConfig = async (id: string) => {
    const dataSourceQuery = this.getDataSourceQuery();
    return this.httpClient.get<ConfigsResponse>(`${NODE_API.GET_CONFIG}/${id}`, dataSourceQuery);
  };

  getChannels = async (
    queryObject: HttpFetchQuery // config_type: Object.keys(CHANNEL_TYPE)
  ): Promise<{ items: ChannelItemType[]; total: number }> => {
    // getConfigs attaches the dataSourceId (including the empty-string local cluster id
    // under MDS), so just forward the query params here.
    const response = await this.getConfigs(queryObject);
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
