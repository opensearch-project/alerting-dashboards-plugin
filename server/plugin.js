/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { createAlertingCluster, createAlertingADCluster } from './clusters';
import {
  AlertService,
  DestinationsService,
  OpensearchService,
  MonitorService,
  AnomalyDetectorService,
  FindingService,
  CrossClusterService,
  CommentsService,
} from './services';
import { FeatureFlagService } from './services/FeatureFlagService';
import { FEATURE_FLAGS } from './services/utils/constants';
import {
  alerts,
  destinations,
  opensearch,
  monitors,
  detectors,
  findings,
  crossCluster,
  comments,
} from '../server/routes';

export class AlertingPlugin {
  constructor(initializerContext) {
    this.logger = initializerContext.logger.get();
    this.globalConfig$ = initializerContext.config.legacy.globalConfig$;
    this.pluginConfig$ = initializerContext.config.create();
  }

  async setup(core, { dataSource }) {
    // Get the global configuration settings of the cluster
    const globalConfig = await this.globalConfig$.pipe(first()).toPromise();
    const pluginConfig = await this.pluginConfig$.pipe(first()).toPromise();

    const dataSourceEnabled = !!dataSource;

    const featureFlagService = new FeatureFlagService(core, this.logger, {
      pluginConfigPath: 'opensearch_alerting',
      defaults: {
        [FEATURE_FLAGS.PPL_MONITOR]: pluginConfig.pplAlertingEnabled === true,
      },
    });

    // Create clusters
    const alertingESClient = createAlertingCluster(
      core,
      globalConfig,
      dataSourceEnabled,
      dataSource
    );
    const adESClient = createAlertingADCluster(core, globalConfig, dataSourceEnabled, dataSource);

    // Initialize services
    const alertService = new AlertService(alertingESClient, dataSourceEnabled);
    const opensearchService = new OpensearchService(alertingESClient, dataSourceEnabled);
    const monitorService = new MonitorService(
      alertingESClient,
      dataSourceEnabled,
      featureFlagService,
      this.logger
    );
    const destinationsService = new DestinationsService(alertingESClient, dataSourceEnabled);
    const anomalyDetectorService = new AnomalyDetectorService(adESClient, dataSourceEnabled);
    const findingService = new FindingService(alertingESClient, dataSourceEnabled);
    const crossClusterService = new CrossClusterService(alertingESClient, dataSourceEnabled);
    const commentsService = new CommentsService(alertingESClient, dataSourceEnabled);
    const services = {
      alertService,
      destinationsService,
      opensearchService,
      monitorService,
      anomalyDetectorService,
      findingService,
      crossClusterService,
      commentsService,
    };

    const defaultPplEnabled = featureFlagService.getDefault(FEATURE_FLAGS.PPL_MONITOR);
    core.capabilities.registerProvider(() => ({
      alertingDashboards: {
        pplV2: defaultPplEnabled,
      },
    }));

    core.capabilities.registerSwitcher(async (request) => {
      const pplEnabled = await featureFlagService.isFeatureEnabled(
        request,
        FEATURE_FLAGS.PPL_MONITOR
      );
      return {
        alertingDashboards: {
          pplV2: pplEnabled,
        },
      };
    });

    // Create router
    const router = core.http.createRouter();
    // Add server routes
    alerts(services, router, dataSourceEnabled);
    destinations(services, router, dataSourceEnabled);
    opensearch(services, router, dataSourceEnabled);
    monitors(services, router, dataSourceEnabled);
    detectors(services, router, dataSourceEnabled);
    findings(services, router, dataSourceEnabled);
    crossCluster(services, router, dataSourceEnabled);
    comments(services, router, dataSourceEnabled);

    return {};
  }

  async start(core) {
    return {};
  }
}
