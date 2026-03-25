/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { INDEX, PLUGIN_NAME } from '../support/constants';
import sampleAlertsFlyoutBucketMonitor from '../fixtures/sample_alerts_flyout_bucket_level_monitor.json';
import sampleAlertsFlyoutQueryMonitor from '../fixtures/sample_alerts_flyout_query_level_monitor.json';

const BUCKET_MONITOR = 'sample_alerts_flyout_bucket_level_monitor';
const BUCKET_TRIGGER = 'sample_alerts_flyout_bucket_level_trigger';
const QUERY_MONITOR = 'sample_alerts_flyout_query_level_monitor';
const QUERY_TRIGGER = 'sample_alerts_flyout_query_level_trigger';

const TWENTY_SECONDS = 20000;

const SIXTY_SECONDS = 60000;

describe('AcknowledgeAlertsModal', () => {
  let bucketMonitorId;
  let queryMonitorId;

  before(() => {
    // Delete any existing monitors
    cy.deleteAllAlerts();
    cy.deleteAllMonitors();

    // Load sample data
    cy.loadSampleEcommerceData();

    // Create the test monitors and retain IDs so we can force executions in each test.
    cy.createMonitor(sampleAlertsFlyoutBucketMonitor).then((response) => {
      bucketMonitorId = response.body._id;
    });
    cy.createMonitor(sampleAlertsFlyoutQueryMonitor).then((response) => {
      queryMonitorId = response.body._id;
    });

    // Visit Alerting OpenSearch Dashboards
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors`, {
      timeout: SIXTY_SECONDS,
    });

    // Confirm test monitors were created successfully
    cy.contains(BUCKET_MONITOR, { timeout: SIXTY_SECONDS });
    cy.contains(QUERY_MONITOR, { timeout: SIXTY_SECONDS });

    // Create initial alerts for both monitors before tests begin.
    cy.then(() => {
      cy.executeMonitor(bucketMonitorId);
      cy.executeMonitor(queryMonitorId);
    });
  });

  beforeEach(() => {
    // Execute monitors before each test so dashboard rows are deterministic.
    cy.then(() => {
      cy.executeMonitor(bucketMonitorId);
      cy.executeMonitor(queryMonitorId);
    });

    // Reloading the page to close any modals that were not closed by other tests that had failures.
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/dashboard`);
    cy.get('[data-test-subj="alertsDashboard_table"]', { timeout: TWENTY_SECONDS }).should('exist');
    cy.wait(5000);

    // Confirm dashboard is displaying rows for the test triggers.
    cy.contains(BUCKET_TRIGGER, { timeout: SIXTY_SECONDS });
    cy.contains(QUERY_TRIGGER, { timeout: SIXTY_SECONDS });
  });

  it('Acknowledge button disabled when more than 1 trigger selected', () => {
    // Set the 'severity' filter to only display rows with ACTIVE alerts.
    cy.get('[data-test-subj="dashboardAlertStateFilter"]').select('Active');

    // Confirm the 'Alerts by trigger' dashboard contains more than 1 row.
    cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
      expect($tr).to.have.length.greaterThan(1)
    );

    // Select the first and last rows in the table.
    cy.get('input[data-test-subj^="checkboxSelectRow-"]').first().click();
    cy.get('input[data-test-subj^="checkboxSelectRow-"]').last().click();

    // Click the 'Alerts by trigger' dashboard 'Acknowledge' button.
    cy.get('[data-test-subj="acknowledgeAlertsButton"]').should('be.disabled');
  });

  it('Bucket-level monitor modal test', () => {
    // To simplify testing, filter the dashboard to only display the desired trigger.
    cy.get(`input[type="search"]`).focus().type(BUCKET_TRIGGER);

    // Confirm the dashboard is displaying only 1 row.
    cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
      expect($tr).to.have.length(1)
    );

    // Find the row for the trigger, and check off the checkbox.
    cy.get('input[data-test-subj^="checkboxSelectRow-"]').first().click();

    // Click the 'Alerts by trigger' dashboard 'Acknowledge' button.
    cy.get('[data-test-subj="acknowledgeAlertsButton"]').click();

    // Perform the test checks within the modal component.
    cy.get(`[data-test-subj="alertsDashboardModal_${BUCKET_TRIGGER}"]`).within(() => {
      // Confirm modal header contains expected text.
      cy.get(`[data-test-subj="alertsDashboardModal_header_${BUCKET_TRIGGER}"]`).contains(
        `Select which alerts to acknowledge for ${BUCKET_TRIGGER}`
      );

      // Set the 'severity' filter to only display ACTIVE alerts.
      cy.get('[data-test-subj="dashboardAlertStateFilter"]').select('Active');

      // This monitor configuration consistently returns 46 alerts when testing locally.
      // Confirm the modal dashboard contains more than 1 ACTIVE alert.
      cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
        expect($tr).to.have.length.greaterThan(1)
      );

      // Select the first and last alerts in the table.
      cy.get('input[data-test-subj^="checkboxSelectRow-"]', { timeout: TWENTY_SECONDS })
        .first()
        .click();
      cy.get('input[data-test-subj^="checkboxSelectRow-"]', { timeout: TWENTY_SECONDS })
        .last()
        .click();

      // Press the modal 'Acknowledge button, and wait for the AcknowledgeAlerts API call to complete.
      cy.get('[data-test-subj="alertsDashboardModal_acknowledgeAlertsButton"]').click();
    });

    // Confirm acknowledge alerts toast displays expected text.
    cy.contains('Successfully acknowledged 2 alerts.');

    // Confirm alerts were acknowledged as expected.
    cy.get(`[data-test-subj="alertsDashboardModal_${BUCKET_TRIGGER}"]`).within(() => {
      // Set the 'severity' filter to only display ACKNOWLEDGED alerts.
      cy.get('[data-test-subj="dashboardAlertStateFilter"]').select('Acknowledged');

      // Confirm the table displays 2 acknowledged alerts.
      cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
        expect($tr).to.have.length(2)
      );
    });

    // Confirm close button hides the modal.
    cy.get(`[data-test-subj="alertsDashboardModal_closeButton_${BUCKET_TRIGGER}"]`).click();
    cy.contains(`[data-test-subj="alertsDashboardModal_${BUCKET_TRIGGER}"]`).should('not.exist');
  });

  it('Query-level monitor modal test', () => {
    // To simplify testing, filter the dashboard to only display the desired trigger.
    cy.get(`input[type="search"]`).focus().type(QUERY_TRIGGER);

    // Confirm the dashboard is displaying only 1 row.
    cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
      expect($tr).to.have.length(1)
    );

    // Find the row for the trigger, and check off the checkbox.
    cy.get('input[data-test-subj^="checkboxSelectRow-"]').first().click();

    // Click the 'Alerts by trigger' dashboard 'Acknowledge' button.
    cy.get('[data-test-subj="acknowledgeAlertsButton"]').click();

    // Perform the test checks within the modal component.
    cy.get(`[data-test-subj="alertsDashboardModal_${QUERY_TRIGGER}"]`).within(() => {
      // Confirm modal header contains expected text.
      cy.get(`[data-test-subj="alertsDashboardModal_header_${QUERY_TRIGGER}"]`).contains(
        `Select which alerts to acknowledge for ${QUERY_TRIGGER}`
      );

      // Set the 'severity' filter to only display ACTIVE alerts.
      cy.get('[data-test-subj="dashboardAlertStateFilter"]').select('Active');

      // Confirm the modal dashboard contains 1 alert.
      cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
        expect($tr).to.have.length(1)
      );

      // Select the alert.
      cy.get('input[data-test-subj^="checkboxSelectRow-"]').first().click();

      // Press the modal 'Acknowledge' button, and wait for the AcknowledgeAlerts API call to complete.
      cy.get('[data-test-subj="alertsDashboardModal_acknowledgeAlertsButton"]').click();
    });

    // Confirm acknowledge alerts toast displays expected text.
    cy.contains('Successfully acknowledged 1 alert.');

    // Confirm alerts were acknowledged as expected.
    cy.get(`[data-test-subj="alertsDashboardModal_${QUERY_TRIGGER}"]`).within(() => {
      // Set the 'severity' filter to only display ACKNOWLEDGED alerts.
      cy.get('[data-test-subj="dashboardAlertStateFilter"]').select('Acknowledged');

      // Confirm the table displays 1 acknowledged alert.
      cy.get('tbody > tr', { timeout: TWENTY_SECONDS }).should(($tr) =>
        expect($tr).to.have.length(1)
      );
    });

    // Confirm close button hides the modal.
    cy.get(`[data-test-subj="alertsDashboardModal_closeButton_${QUERY_TRIGGER}"]`).click();
    cy.contains(`[data-test-subj="alertsDashboardModal_${QUERY_TRIGGER}"]`).should('not.exist');
  });

  after(() => {
    // Delete all monitors
    cy.deleteAllMonitors();

    // Delete sample data
    cy.deleteIndexByName(`${INDEX.SAMPLE_DATA_ECOMMERCE}`);
  });
});
