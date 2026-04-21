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
  PplAlertingMonitorService,
  AnomalyDetectorService,
  FindingService,
  CrossClusterService,
  CommentsService,
} from './services';
import { FeatureFlagService } from './services/FeatureFlagService';
import { FEATURE_FLAGS, PLUGIN_ID } from './services/utils/constants';
import {
  alerts,
  destinations,
  opensearch,
  monitors,
  pplAlertingMonitors,
  detectors,
  findings,
  crossCluster,
  comments,
} from '../server/routes';
import { JSON_SCHEMA } from 'js-yaml';
import { getWorkspaceState } from '../../../src/core/server/utils';

export class AlertingPlugin {
  constructor(initializerContext) {
    this.logger = initializerContext.logger.get();
    this.globalConfig$ = initializerContext.config.legacy.globalConfig$;
    this.pluginConfig$ = initializerContext.config.create();
    this.core = null;
    this.featureFlagService = null;
    this.services = null;
  }

  async setup(core, { dataSource }) {
    this.core = core;
    // Get the global configuration settings of the cluster
    const globalConfig = await this.globalConfig$.pipe(first()).toPromise();
    const pluginConfig = await this.pluginConfig$.pipe(first()).toPromise();

    const dataSourceEnabled = !!dataSource;
    const defaultPplEnabled = Boolean(pluginConfig?.pplAlertingEnabled);
    this.featureFlagService = new FeatureFlagService(core, this.logger, {
      pluginConfigPath: PLUGIN_ID,
      defaults: {
        [FEATURE_FLAGS.PPL_MONITOR]: defaultPplEnabled,
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
    const monitorService = new MonitorService(alertingESClient, dataSourceEnabled);
    const pplMonitorService = new PplAlertingMonitorService(
      alertingESClient,
      dataSourceEnabled,
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
      pplMonitorService,
      anomalyDetectorService,
      findingService,
      crossClusterService,
      commentsService,
    };
    this.services = services;

    core.capabilities.registerProvider(() => ({
      alertingDashboards: {
        pplV2: defaultPplEnabled,
      },
    }));

    core.capabilities.registerSwitcher(async (request) => {
      try {
        if (!this.featureFlagService) {
          return {
            alertingDashboards: {
              pplV2: defaultPplEnabled,
            },
          };
        }
        const status = await this.featureFlagService.getFeatureStatus(request, [
          FEATURE_FLAGS.PPL_MONITOR,
        ]);
        return {
          alertingDashboards: {
            pplV2: Boolean(status?.[FEATURE_FLAGS.PPL_MONITOR]),
          },
        };
      } catch (err) {
        this.logger?.debug?.(
          `[Alerting][Plugin] Failed to resolve dynamic feature flags: ${err?.message ?? err}`
        );
        return {
          alertingDashboards: {
            pplV2: defaultPplEnabled,
          },
        };
      }
    });

    // Create router
    const router = core.http.createRouter();

    // Routes that return 501 on unsupported (e.g. serverless) endpoints.
    // Uses path patterns — {param} segments are normalized to match any value.
    const unsupportedRoutes = new Set([
      'POST /api/alerting/workflows',
      'GET /api/alerting/workflows/{id}',
      'PUT /api/alerting/workflows/{id}',
      'DELETE /api/alerting/workflows/{id}',
      'POST /api/alerting/workflows/{id}/_acknowledge/alerts',
      'POST /api/alerting/comments/_search',
      'POST /api/alerting/comments/{alertId}',
      'PUT /api/alerting/comments/{commentId}',
      'DELETE /api/alerting/comments/{commentId}',
      'GET /api/alerting/destinations',
      'GET /api/alerting/destinations/{destinationId}',
      'POST /api/alerting/destinations',
      'PUT /api/alerting/destinations/{destinationId}',
      'DELETE /api/alerting/destinations/{destinationId}',
      'GET /api/alerting/destinations/email_accounts',
      'POST /api/alerting/destinations/email_accounts',
      'GET /api/alerting/destinations/email_accounts/{id}',
      'PUT /api/alerting/destinations/email_accounts/{id}',
      'DELETE /api/alerting/destinations/email_accounts/{id}',
      'GET /api/alerting/destinations/email_groups',
      'POST /api/alerting/destinations/email_groups',
      'GET /api/alerting/destinations/email_groups/{id}',
      'PUT /api/alerting/destinations/email_groups/{id}',
      'DELETE /api/alerting/destinations/email_groups/{id}',
      'GET /api/alerting/findings/_search',
    ]);

    // Wrap router to auto-reject unsupported routes on serverless endpoints.
    const { monitorService } = services;
    const guardedRouter = ['get', 'post', 'put', 'delete'].reduce((proxy, method) => {
      proxy[method] = (route, handler) => {
        const key = `${method.toUpperCase()} ${route.path}`;
        if (unsupportedRoutes.has(key)) {
          router[method](route, async (context, req, res) => {
            const rejected = await monitorService.rejectIfUnsupported(context, req, res);
            if (rejected) return rejected;
            return handler(context, req, res);
          });
        } else {
          router[method](route, handler);
        }
      };
      return proxy;
    }, {});
    const registerPplRoutes = () => pplAlertingMonitors(services, guardedRouter, dataSourceEnabled);

    if (defaultPplEnabled) {
      registerPplRoutes();
    } else if (this.featureFlagService) {
      core
        .getStartServices()
        .then(async () => {
          try {
            const config = await this.featureFlagService.getConfigFromDynamicStore();
            if (config?.[FEATURE_FLAGS.PPL_MONITOR]) {
              registerPplRoutes();
            }
          } catch (err) {
            this.logger?.debug?.(
              `[Alerting][Plugin] Failed to register PPL routes from dynamic config: ${
                err?.message ?? err
              }`
            );
          }
        })
        .catch((err) => {
          this.logger?.debug?.(
            `[Alerting][Plugin] Failed to resolve start services for dynamic PPL flag: ${
              err?.message ?? err
            }`
          );
        });
    }

    // Add server routes
    alerts(services, guardedRouter, dataSourceEnabled);
    destinations(services, guardedRouter, dataSourceEnabled);
    opensearch(services, guardedRouter, dataSourceEnabled);
    monitors(services, guardedRouter, dataSourceEnabled);
    detectors(services, guardedRouter, dataSourceEnabled);
    findings(services, guardedRouter, dataSourceEnabled);
    crossCluster(services, guardedRouter, dataSourceEnabled);
    comments(services, guardedRouter, dataSourceEnabled);

    return {};
  }

  async start(core, plugins) {
    if (this.services) {
      const workspaceIdGetter = (request) => {
        try {
          return getWorkspaceState(request).requestWorkspaceId;
        } catch (e) {
          return undefined;
        }
      };

      Object.values(this.services).forEach((service) => {
        if (plugins?.workspace && typeof service.setWorkspaceStart === 'function') {
          service.setWorkspaceStart(plugins.workspace);
        }
        if (typeof service.setWorkspaceIdGetter === 'function') {
          service.setWorkspaceIdGetter(workspaceIdGetter);
        }
      });
    }
    return {};
  }
}
