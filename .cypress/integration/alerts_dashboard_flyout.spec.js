/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX, PLUGIN_NAME } from '../support/constants';
import sampleAlertsFlyoutBucketMonitor from '../fixtures/sample_alerts_flyout_bucket_level_monitor.json';
import sampleAlertsFlyoutQueryMonitor from '../fixtures/sample_alerts_flyout_query_level_monitor.json';

const BUCKET_MONITOR = 'sample_alerts_flyout_bucket_level_monitor';
const BUCKET_TRIGGER = 'sample_alerts_flyout_bucket_level_trigger';
const QUERY_MONITOR = 'sample_alerts_flyout_query_level_monitor';
const QUERY_TRIGGER = 'sample_alerts_flyout_query_level_trigger';

const TWENTY_SECONDS = 20000;

describe('Alerts by trigger flyout', () => {
  before(() => {
    // Delete any existing monitors
    cy.deleteAllMonitors();

    // Load sample data
    cy.loadSampleEcommerceData();

    // Ensure monitors have been deleted
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors`);
    cy.contains('There are no existing monitors. Create a monitor to add triggers and actions.', {
      timeout: TWENTY_SECONDS,
    });

    // Create the test monitors
    cy.createMonitor(sampleAlertsFlyoutBucketMonitor);
    cy.createMonitor(sampleAlertsFlyoutQueryMonitor);

    // Visit Alerting OpenSearch Dashboards
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors`);
    cy.reload();

    // Confirm test monitors were created successfully
    cy.contains(BUCKET_MONITOR, { timeout: TWENTY_SECONDS });
    cy.contains(QUERY_MONITOR, { timeout: TWENTY_SECONDS });

    // Wait 1 minutes for the test monitors to trigger alerts, then go to the 'Alerts by trigger' dashboard page to view alerts
    cy.wait(60000);
  });

  beforeEach(() => {
    // Reloading the page to close any flyouts that were not closed by other tests that had failures.
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/dashboard`);
    cy.contains('Alerts by triggers', { timeout: TWENTY_SECONDS });

    // Waiting 5 seconds for alerts to finish loading.
    // This short wait period alleviates flakiness observed during these tests.
    cy.wait(5000);

    // Confirm dashboard is displaying rows for the test monitors.
    cy.contains(BUCKET_MONITOR, { timeout: TWENTY_SECONDS });
    cy.contains(QUERY_MONITOR, { timeout: TWENTY_SECONDS });
  });

  it('Bucket-level monitor flyout test', () => {
    // Click the link for the flyout.
    cy.get(`[data-test-subj="euiLink_${BUCKET_TRIGGER}"]`).click();

    // Perform the test checks within the flyout component.
    cy.get(`[data-test-subj="alertsDashboardFlyout_${BUCKET_TRIGGER}"]`, {
      timeout: TWENTY_SECONDS,
    }).within(() => {
      // Confirm flyout header contains expected text.
      cy.get(`[data-test-subj="alertsDashboardFlyout_header_${BUCKET_TRIGGER}"]`).contains(
        `Alerts by ${BUCKET_TRIGGER}`,
        { timeout: TWENTY_SECONDS }
      );

      // Confirm 'Trigger name' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_triggerName_${BUCKET_TRIGGER}"]`).as(
        'triggerName'
      );
      cy.get('@triggerName').contains('Trigger name');
      cy.get('@triggerName').contains(BUCKET_TRIGGER, { timeout: TWENTY_SECONDS });

      // Confirm 'Severity' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_severity_${BUCKET_TRIGGER}"]`).as('severity');
      cy.get('@severity').contains('Severity');
      cy.get('@severity').contains('4 (Low)', { timeout: TWENTY_SECONDS });

      // Confirm 'Monitor' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_monitor_${BUCKET_TRIGGER}"]`).as('monitor');
      cy.get('@monitor').contains('Monitor');
      cy.get('@monitor').contains(BUCKET_MONITOR, { timeout: TWENTY_SECONDS });

      // Confirm 'Conditions' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_conditions_${BUCKET_TRIGGER}"]`).as(
        'conditions'
      );
      cy.get('@conditions').contains('Conditions');

      // Confirm the 'Conditions' sections renders with all of the expected conditions.
      ['params._count < 10000', 'OR', 'params.avg_products_price == 10'].forEach((entry) =>
        cy.get('@conditions').contains(entry, { timeout: TWENTY_SECONDS })
      );

      // Confirm 'Time range for the last' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_timeRange_${BUCKET_TRIGGER}"]`).as(
        'timeRange'
      );
      cy.get('@timeRange').contains('Time range for the last');
      cy.get('@timeRange').contains('10 day(s)', { timeout: TWENTY_SECONDS });

      // Confirm 'Filters' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_filters_${BUCKET_TRIGGER}"]`).as('filters');
      cy.get('@filters').contains('Filters');
      cy.get('@filters').contains('All fields are included', { timeout: TWENTY_SECONDS });

      // Confirm 'Group by' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_groupBy_${BUCKET_TRIGGER}"]`).as('groupBy');
      cy.get('@groupBy').contains('Group by');
      cy.get('@groupBy').contains('customer_gender, user', { timeout: TWENTY_SECONDS });

      // Set the 'severity' filter to only display ACTIVE alerts.
      cy.get('[data-test-subj="dashboardAlertStateFilter"]').select('Active');

      // This monitor configuration consistently returns 46 alerts when testing locally.
      // Confirm the flyout dashboard contains more than 1 ACTIVE alert.
      cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
        expect($tr).to.have.length.greaterThan(1)
      );

      // Select the first and last alerts in the table.
      cy.get('input[data-test-subj^="checkboxSelectRow-"]').first().click();
      cy.get('input[data-test-subj^="checkboxSelectRow-"]').last().click();

      // Press the flyout 'Acknowledge button, and wait for the AcknowledgeAlerts API call to complete.
      cy.get('[data-test-subj="flyoutAcknowledgeAlertsButton"]').click();
    });

    // Confirm acknowledge alerts toast displays expected text.
    cy.contains('Successfully acknowledged 2 alerts.', { timeout: TWENTY_SECONDS });

    // Confirm alerts were acknowledged as expected.
    cy.get(`[data-test-subj="alertsDashboardFlyout_${BUCKET_TRIGGER}"]`).within(() => {
      // Set the 'severity' filter to only display ACKNOWLEDGED alerts.
      cy.get('[data-test-subj="dashboardAlertStateFilter"]').select('Acknowledged');

      // Confirm the table displays 2 acknowledged alerts.
      cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
        expect($tr).to.have.length(2)
      );
    });

    // Confirm close button hides the flyout.
    cy.get(`[data-test-subj="alertsDashboardFlyout_closeButton_${BUCKET_TRIGGER}"]`).click();
    cy.contains(`[data-test-subj="alertsDashboardFlyout_${BUCKET_TRIGGER}"]`).should('not.exist');
  });

  it('Query-level monitor flyout test', () => {
    // Click the link for the flyout.
    cy.get(`[data-test-subj="euiLink_${QUERY_TRIGGER}"]`).click();

    // Perform the test checks within the flyout component.
    cy.get(`[data-test-subj="alertsDashboardFlyout_${QUERY_TRIGGER}"]`, {
      timeout: TWENTY_SECONDS,
    }).within(() => {
      // Confirm flyout header contains expected text.
      cy.get(`[data-test-subj="alertsDashboardFlyout_header_${QUERY_TRIGGER}"]`).contains(
        `Alerts by ${QUERY_TRIGGER}`,
        { timeout: TWENTY_SECONDS }
      );

      // Confirm 'Trigger name' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_triggerName_${QUERY_TRIGGER}"]`).as(
        'triggerName'
      );
      cy.get('@triggerName').contains('Trigger name');
      cy.get('@triggerName').contains(QUERY_TRIGGER, { timeout: TWENTY_SECONDS });

      // Confirm 'Severity' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_severity_${QUERY_TRIGGER}"]`).as('severity');
      cy.get('@severity').contains('Severity');
      cy.get('@severity').contains('2 (High)', { timeout: TWENTY_SECONDS });

      // Confirm 'Monitor' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_monitor_${QUERY_TRIGGER}"]`).as('monitor');
      cy.get('@monitor').contains('Monitor');
      cy.get('@monitor').contains(QUERY_MONITOR, { timeout: TWENTY_SECONDS });

      // Confirm 'Conditions' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_conditions_${QUERY_TRIGGER}"]`).as(
        'conditions'
      );
      cy.get('@conditions').contains('Condition');
      cy.get('@conditions').contains(`ctx.results[0].hits.total.value < 10000`, {
        timeout: TWENTY_SECONDS,
      });

      // Confirm 'Time range for the last' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_timeRange_${QUERY_TRIGGER}"]`).as('timeRange');
      cy.get('@timeRange').contains('Time range for the last');
      cy.get('@timeRange').contains('10 day(s)', { timeout: TWENTY_SECONDS });

      // Confirm 'Filters' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_filters_${QUERY_TRIGGER}"]`).as('filters');
      cy.get('@filters').contains('Filters');
      cy.get('@filters').contains('-', { timeout: TWENTY_SECONDS });

      // Confirm 'Group by' sections renders as expected.
      cy.get(`[data-test-subj="alertsDashboardFlyout_groupBy_${QUERY_TRIGGER}"]`).as('groupBy');
      cy.get('@groupBy').contains('Group by');
      cy.get('@groupBy').contains('user', { timeout: TWENTY_SECONDS });

      // Set the 'severity' filter to only display ACTIVE alerts.
      cy.get('[data-test-subj="dashboardAlertStateFilter"]').select('Active');

      // Confirm the flyout dashboard contains 1 alert.
      cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
        expect($tr).to.have.length(1)
      );

      // Select the alert.
      cy.get('input[data-test-subj^="checkboxSelectRow-"]').first().click();

      // Press the flyout 'Acknowledge button, and wait for the AcknowledgeAlerts API call to complete.
      cy.get('[data-test-subj="flyoutAcknowledgeAlertsButton"]').click();
    });

    // Confirm acknowledge alerts toast displays expected text.
    cy.contains('Successfully acknowledged 1 alert.', { timeout: TWENTY_SECONDS });

    // Confirm alerts were acknowledged as expected.
    cy.get(`[data-test-subj="alertsDashboardFlyout_${QUERY_TRIGGER}"]`).within(() => {
      // Set the 'severity' filter to only display ACKNOWLEDGED alerts.
      cy.get('[data-test-subj="dashboardAlertStateFilter"]').select('Acknowledged');

      // Confirm the table displays 1 acknowledged alert.
      cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
        expect($tr).to.have.length(1)
      );
    });

    // Confirm close button hides the flyout.
    cy.get(`[data-test-subj="alertsDashboardFlyout_closeButton_${QUERY_TRIGGER}"]`).click();
    cy.contains(`[data-test-subj="alertsDashboardFlyout_${QUERY_TRIGGER}"]`).should('not.exist');
  });

  after(() => {
    // Delete all monitors
    cy.deleteAllMonitors();

    // Delete sample data
    cy.deleteIndexByName(`${INDEX.SAMPLE_DATA_ECOMMERCE}`);
  });
});
