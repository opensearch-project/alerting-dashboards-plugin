/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX, PLUGIN_NAME } from '../support/constants';
import sampleAlertsFlyoutBucketMonitor from '../fixtures/sample_alerts_flyout_bucket_level_monitor.json';
import sampleAlertsFlyoutQueryMonitor from '../fixtures/sample_alerts_flyout_query_level_monitor.json';
import sampleClusterMetricsHealthMonitor from '../fixtures/sample_cluster_metrics_health_monitor.json';
import sampleClusterMetricsStatsMonitor from '../fixtures/sample_cluster_metrics_stats_monitor.json';

const queryMonitor = {
  ...sampleAlertsFlyoutQueryMonitor,
  id: 'monitors_dashboard_cypress_query_level',
  name: 'monitors_dashboard_cypress_query_level',
  enabled: false,
};
const bucketMonitor = {
  ...sampleAlertsFlyoutBucketMonitor,
  id: 'monitors_dashboard_cypress_bucket_level',
  name: 'monitors_dashboard_cypress_bucket_level',
  enabled: false,
};
const clusterHealthMonitor = {
  ...sampleClusterMetricsHealthMonitor,
  id: 'monitors_dashboard_cypress_cluster_health',
  name: 'monitors_dashboard_cypress_cluster_health',
  enabled: false,
  triggers: [
    {
      query_level_trigger: {
        id: 'WJmlA4kBIezNcMbMwnFg',
        name: 'sample_cluster_metrics_health_monitor-trigger1',
        severity: '1',
        condition: {
          script: {
            source: 'ctx.results[0].status != "blue"',
            lang: 'painless',
          },
        },
        actions: [],
      },
    },
  ],
};
const clusterStatsMonitor = {
  ...sampleClusterMetricsStatsMonitor,
  enabled: false,
  id: 'monitors_dashboard_cypress_cluster_stats',
  name: 'monitors_dashboard_cypress_cluster_stats',
};
const testMonitors = [
  {
    monitor: queryMonitor,
    expectedAlertsCount: 1,
    triggerName: queryMonitor.triggers[0].query_level_trigger.name,
  },
  {
    monitor: bucketMonitor,
    expectedAlertsCount: 46,
    triggerName: bucketMonitor.triggers[0].bucket_level_trigger.name,
  },
  {
    monitor: clusterHealthMonitor,
    expectedAlertsCount: 1,
    triggerName: clusterHealthMonitor.triggers[0].query_level_trigger.name,
  },
  {
    monitor: clusterStatsMonitor,
    expectedAlertsCount: 1,
    triggerName: clusterStatsMonitor.triggers[0].query_level_trigger.name,
  },
];

describe('Monitors dashboard page', () => {
  before(() => {
    // Delete any existing monitors
    cy.deleteAllMonitors()
      .then(() => {
        // Load sample data
        cy.loadSampleEcommerceData();
      })
      .then(() => {
        // Short wait to reduce flakiness while ecommerce data is loaded
        cy.wait(5000);

        // Create the test monitors
        testMonitors.forEach((entry) => cy.createAndExecuteMonitor(entry.monitor));
      });

    // Visit Alerting OpenSearch Dashboards
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors`);
  });

  beforeEach(() => {
    // Refresh Alerting OpenSearch Dashboards
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors`);

    // Common text to wait for to confirm page loaded, give up to 20 seconds for initial load
    cy.contains('Create monitor', { timeout: 20000 });
  });

  it('Displays expected number of alerts', () => {
    // Wait for table to finish loading
    cy.get('tbody > tr', { timeout: 20000 }).should(($tr) =>
      expect($tr).to.have.length.greaterThan(1)
    );

    // Ensure the 'Monitor name' column is sorted in ascending order by sorting another column first
    cy.contains('Last notification time').click({ force: true });
    cy.contains('Monitor name').click({ force: true });

    testMonitors.forEach((entry) => {
      cy.get('tbody > tr')
        .filter(`:contains(${entry.monitor.name})`, { timeout: 20000 })
        .within(() => {
          cy.get('[class="euiTableRowCell"]')
            .filter(':contains(Latest alert)', { timeout: 20000 })
            .should('contain', entry.triggerName);

          cy.get('[class="euiTableRowCell"]')
            .filter(':contains(State)', { timeout: 20000 })
            .should('contain', 'Disabled');

          cy.get('[class="euiTableRowCell"]')
            .filter(':contains(Active)', { timeout: 20000 })
            .should('contain', entry.expectedAlertsCount);

          cy.get('[class="euiTableRowCell"]')
            .filter(':contains(Acknowledged)', { timeout: 20000 })
            .should('contain', 0);

          cy.get('[class="euiTableRowCell"]')
            .filter(':contains(Errors)', { timeout: 20000 })
            .should('contain', 0);

          cy.get('[class="euiTableRowCell"]')
            .filter(':contains(Ignored)', { timeout: 20000 })
            .should('contain', 0);
        });
    });
  });

  after(() => {
    // Delete all monitors
    cy.deleteAllMonitors();

    // Delete sample data
    cy.deleteIndexByName(INDEX.SAMPLE_DATA_ECOMMERCE);
  });
});
