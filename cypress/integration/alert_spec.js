/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PLUGIN_NAME } from '../support/constants';
import sampleQueryLevelMonitorWithAlwaysTrueTrigger from '../fixtures/sample_query_level_monitor_with_always_true_trigger';
import sampleQueryLevelMonitorWorkflow from '../fixtures/sample_query_level_monitor_workflow';

const TESTING_INDEX = 'alerting_test';

describe('Alerts', () => {
  beforeEach(() => {
    // Set welcome screen tracking to false
    localStorage.setItem('home:welcome:show', 'false');

    // Visit Alerting OpenSearch Dashboards
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/dashboard`);

    // Common text to wait for to confirm page loaded, give up to 30 seconds for initial load
    cy.contains('Acknowledge', { timeout: 30000 });
  });

  describe("can be in 'Active' state", () => {
    before(() => {
      cy.deleteAllMonitors();
      // Generate a unique number in every test by getting a unix timestamp in milliseconds
      Cypress.config('unique_number', `${Date.now()}`);
      // Modify the monitor name to be unique
      sampleQueryLevelMonitorWithAlwaysTrueTrigger.name += `-${Cypress.config('unique_number')}`;
      cy.createMonitor(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
    });

    it('after the monitor starts running', () => {
      // Wait for 1 minute
      cy.wait(60000);

      // Reload the page
      cy.reload();

      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`)
        .focus()
        .type(`${Cypress.config('unique_number')}`);

      // Confirm we can see one and only alert in Active state
      cy.get('tbody > tr').should(($tr) => {
        expect($tr, '1 row').to.have.length(1);
        expect($tr, 'item').to.contain('Active');
      });
    });
  });

  describe("can be in 'Acknowledged' state", () => {
    before(() => {
      cy.deleteAllMonitors();
      Cypress.config('unique_number', `${Date.now()}`);
      // Modify the monitor name to be unique
      sampleQueryLevelMonitorWithAlwaysTrueTrigger.name += `-${Cypress.config('unique_number')}`;
      cy.createAndExecuteMonitor(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
    });

    it('by clicking the button in Dashboard', () => {
      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`)
        .focus()
        .type(`${Cypress.config('unique_number')}`);

      //Confirm there is an active alert
      cy.contains('Active');

      // Select checkbox for the existing alert
      // There may be multiple alerts in the cluster, first() is used to get the active alert
      cy.get('input[data-test-subj^="checkboxSelectRow-"]').first().click({ force: true });

      // Click Acknowledge button
      cy.get('button').contains('Acknowledge').click({ force: true });

      // Confirm we can see the alert is in 'Acknowledged' state
      cy.contains('Acknowledged');
    });
  });

  describe("can be in 'Completed' state", () => {
    before(() => {
      cy.deleteAllMonitors();
      // Delete the target indices defined in 'sample_monitor_workflow.json'
      cy.deleteIndexByName('alerting*');
      Cypress.config('unique_number', `${Date.now()}`);
      // Modify the monitor name to be unique
      sampleQueryLevelMonitorWorkflow.name += `-${Cypress.config('unique_number')}`;
      cy.createAndExecuteMonitor(sampleQueryLevelMonitorWorkflow);
    });

    it('when the trigger condition is not met after met once', () => {
      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`)
        .focus()
        .type(`${Cypress.config('unique_number')}`);

      // Confirm there is an active alert
      cy.contains('Active');

      // The trigger condition is: there is no document in the indices 'alerting*'
      // The following commands create a document in the index to complete the alert
      // Create an index
      cy.createIndexByName(TESTING_INDEX);

      // Insert a document
      cy.insertDocumentToIndex('test', 1, {});

      // Wait for 1 minute
      cy.wait(60000);

      // Reload the page
      cy.reload();

      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`)
        .focus()
        .type(`${Cypress.config('unique_number')}`);

      // Confirm we can see the alert is in 'Completed' state
      cy.contains('Completed');
    });

    after(() => {
      // Delete the testing index
      cy.deleteIndexByName(TESTING_INDEX);
    });
  });

  describe("can be in 'Error' state", () => {
    before(() => {
      cy.deleteAllMonitors();
      // modify the JSON object to make an error alert when executing the monitor
      sampleQueryLevelMonitorWithAlwaysTrueTrigger.triggers[0].actions = [
        { name: '', destination_id: '', message_template: { source: '' } },
      ];
      Cypress.config('unique_number', `${Date.now()}`);
      // Modify the monitor name to be unique
      sampleQueryLevelMonitorWithAlwaysTrueTrigger.name += `-${Cypress.config('unique_number')}`;
      cy.createAndExecuteMonitor(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
    });

    it('by using a wrong destination', () => {
      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`)
        .focus()
        .type(`${Cypress.config('unique_number')}`);

      // Confirm we can see the alert is in 'Error' state
      cy.contains('Error');
    });
  });

  describe("can be in 'Deleted' state", () => {
    before(() => {
      cy.deleteAllMonitors();
      Cypress.config('unique_number', `${Date.now()}`);
      // Modify the monitor name to be unique
      sampleQueryLevelMonitorWithAlwaysTrueTrigger.name += `-${Cypress.config('unique_number')}`;
      cy.createAndExecuteMonitor(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
    });

    it('by deleting the monitor', () => {
      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`)
        .focus()
        .type(`${Cypress.config('unique_number')}`);

      //Confirm there is an active alert
      cy.contains('Active');

      // Delete all existing monitors
      cy.deleteAllMonitors();

      // Reload the page
      cy.reload();

      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`)
        .focus()
        .type(`${Cypress.config('unique_number')}`);

      // Confirm we can see the alert is in 'Deleted' state
      cy.contains('Deleted');
    });
  });

  after(() => {
    // Delete all existing monitors
    cy.deleteAllMonitors();
  });
});
