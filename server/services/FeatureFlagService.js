/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FEATURE_FLAGS } from './utils/constants';

export class FeatureFlagService {
  constructor(coreSetup, logger, options = {}) {
    this.coreSetup = coreSetup;
    this.logger = logger;
    this.pluginConfigPath = options.pluginConfigPath || 'opensearch_alerting';
    this.defaults = options.defaults || {};
    this.dynamicConfigStartPromise = null;
  }

  getDefault(flag) {
    if (this.defaults?.hasOwnProperty(flag)) {
      return Boolean(this.defaults[flag]);
    }
    if (flag === FEATURE_FLAGS.PPL_MONITOR) {
      return false;
    }
    return false;
  }

  async getDynamicConfigStart() {
    if (!this.dynamicConfigStartPromise) {
      const dynamicConfigService = this.coreSetup?.dynamicConfigService;
      if (!dynamicConfigService?.getStartService) {
        this.dynamicConfigStartPromise = Promise.resolve(null);
      } else {
        this.dynamicConfigStartPromise = dynamicConfigService.getStartService().catch((err) => {
          this.logger?.warn?.(
            `[Alerting][FeatureFlagService] Failed to start dynamic config service: ${
              err?.message ?? err
            }`
          );
          return null;
        });
      }
    }
    return this.dynamicConfigStartPromise;
  }

  async getConfigFromDynamicStore(request) {
    try {
      const start = await this.getDynamicConfigStart();
      if (!start) {
        return null;
      }

      const client = start.getClient();
      if (!client) {
        return null;
      }

      let asyncLocalStorageContext = start.getAsyncLocalStore?.();
      if (!asyncLocalStorageContext) {
        try {
          asyncLocalStorageContext = await start.createStoreFromRequest?.(request);
        } catch (err) {
          this.logger?.debug?.(
            `[Alerting][FeatureFlagService] Unable to create async local storage context: ${
              err?.message ?? err
            }`
          );
        }
      }

      const options = asyncLocalStorageContext ? { asyncLocalStorageContext } : undefined;

      const config = await client.getConfig({ pluginConfigPath: this.pluginConfigPath }, options);

      return config || null;
    } catch (err) {
      this.logger?.warn?.(
        `[Alerting][FeatureFlagService] Failed to fetch dynamic config: ${err?.message ?? err}`
      );
      return null;
    }
  }

  async isFeatureEnabled(request, flag) {
    const config = await this.getConfigFromDynamicStore(request);
    if (config && Object.prototype.hasOwnProperty.call(config, flag)) {
      return Boolean(config[flag]);
    }
    return this.getDefault(flag);
  }

  async getFeatureStatus(request, flags = []) {
    const status = {};
    const config = await this.getConfigFromDynamicStore(request);

    for (const flag of flags) {
      if (config && Object.prototype.hasOwnProperty.call(config, flag)) {
        status[flag] = Boolean(config[flag]);
      } else {
        status[flag] = this.getDefault(flag);
      }
    }

    return status;
  }
}
