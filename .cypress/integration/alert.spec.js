/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PLUGIN_NAME } from '../support/constants';
import sampleQueryLevelMonitorWithAlwaysTrueTrigger from '../fixtures/sample_query_level_monitor_with_always_true_trigger';
import sampleQueryLevelMonitorWorkflow from '../fixtures/sample_query_level_monitor_workflow';

const TESTING_INDEX = 'alerting_test';
const cloneFixture = (fixture) => JSON.parse(JSON.stringify(fixture));

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
    let uniqueNumber;
    let monitorId;

    before(() => {
      cy.deleteAllMonitors();
      // Generate a unique number in every test by getting a unix timestamp in milliseconds
      uniqueNumber = `${Date.now()}`;
      const monitor = cloneFixture(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
      monitor.name = `${monitor.name}-${uniqueNumber}`;
      cy.createMonitor(monitor).then((response) => {
        monitorId = response.body._id;
      });
    });

    it('after the monitor starts running', () => {
      cy.executeMonitors([monitorId]);

      // Reload the page
      cy.reload();

      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`).focus().type(uniqueNumber);

      // Confirm we can see one and only alert in Active state
      cy.get('tbody > tr').should(($tr) => {
        expect($tr, '1 row').to.have.length(1);
        expect($tr, 'item').to.contain('Active');
      });
    });
  });

  describe("can be in 'Acknowledged' state", () => {
    let uniqueNumber;

    before(() => {
      cy.deleteAllMonitors();
      uniqueNumber = `${Date.now()}`;
      const monitor = cloneFixture(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
      monitor.name = `${monitor.name}-${uniqueNumber}`;
      cy.createAndExecuteMonitor(monitor);
    });

    it('by clicking the button in Dashboard', () => {
      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`).focus().type(uniqueNumber);

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
    let uniqueNumber;
    let monitorId;

    before(() => {
      cy.deleteAllMonitors();
      // Delete the target indices defined in 'sample_monitor_workflow.json'
      cy.deleteIndexByName('alerting*');
      uniqueNumber = `${Date.now()}`;
      const monitor = cloneFixture(sampleQueryLevelMonitorWorkflow);
      monitor.name = `${monitor.name}-${uniqueNumber}`;
      cy.createMonitor(monitor).then((response) => {
        monitorId = response.body._id;
      });
      cy.then(() => {
        cy.executeMonitors([monitorId]);
      });
    });

    it('when the trigger condition is not met after met once', () => {
      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`).focus().type(uniqueNumber);

      // Confirm there is an active alert
      cy.contains('Active');

      // The trigger condition is: there is no document in the indices 'alerting*'
      // The following commands create a document in the index to complete the alert
      // Create an index
      cy.createIndexByName(TESTING_INDEX);

      // Insert a document
      cy.insertDocumentToIndex('test', 1, {});

      // Execute monitor again after document insertion so the alert transitions to Completed.
      cy.then(() => {
        cy.executeMonitor(monitorId);
      });

      // Reload the page
      cy.reload();

      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`).focus().type(uniqueNumber);

      // Confirm we can see the alert is in 'Completed' state
      cy.contains('Completed');
    });

    after(() => {
      // Delete the testing index
      cy.deleteIndexByName(TESTING_INDEX);
    });
  });

  describe("can be in 'Error' state", () => {
    let uniqueNumber;

    before(() => {
      cy.deleteAllMonitors();
      const monitor = cloneFixture(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
      // modify the JSON object to make an error alert when executing the monitor
      monitor.triggers[0].actions = [
        { name: '', destination_id: '', message_template: { source: '' } },
      ];
      uniqueNumber = `${Date.now()}`;
      monitor.name = `${monitor.name}-${uniqueNumber}`;
      cy.createAndExecuteMonitor(monitor);
    });

    it('by using a wrong destination', () => {
      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`).focus().type(uniqueNumber);

      // Confirm we can see the alert is in 'Error' state
      cy.contains('Error');
    });
  });

  describe("can be in 'Deleted' state", () => {
    let uniqueNumber;

    before(() => {
      cy.deleteAllMonitors();
      uniqueNumber = `${Date.now()}`;
      const monitor = cloneFixture(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
      monitor.name = `${monitor.name}-${uniqueNumber}`;
      cy.createAndExecuteMonitor(monitor);
    });

    it('by deleting the monitor', () => {
      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`).focus().type(uniqueNumber);

      //Confirm there is an active alert
      cy.contains('Active');

      // Delete all existing monitors
      cy.deleteAllMonitors();

      // Reload the page
      cy.reload();

      // Type in monitor name in search box to filter out the alert
      cy.get(`input[type="search"]`).focus().type(uniqueNumber);

      // Confirm we can see the alert is in 'Deleted' state
      cy.contains('Deleted');
    });
  });

  after(() => {
    // Delete all existing monitors
    cy.deleteAllMonitors();
  });
});
