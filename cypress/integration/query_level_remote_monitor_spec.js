/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { INDEX, PLUGIN_NAME } from '../support/constants';
import sampleQueryLevelRemoteMonitor from '../fixtures/sample_query_level_remote_monitor';
import sampleQueryLevelRemoteMonitorWithAlwaysTrueTrigger from '../fixtures/sample_query_level_remote_monitor_with_always_true_trigger';

const SAMPLE_MONITOR = 'sample_query_level_remote_monitor';
const UPDATED_MONITOR = 'updated_query_level_remote_monitor';
const SAMPLE_MONITOR_WITH_ANOTHER_NAME =
  'sample_query_level_remote_monitor_with_always_true_trigger';
const SAMPLE_TRIGGER = 'sample_trigger';

const TESTING_INDEX_A = 'query-level-monitor-test-index-a';
const TESTING_INDEX_B = 'query-level-monitor-test-index-b';

if (Cypress.env('remote_cluster_enabled')) {
  describe('Query-Level Remote Monitors', () => {
    before(() => {
      cy.insertDocumentToIndex(TESTING_INDEX_A, undefined, { message: 'This is a test.' });
      cy.insertDocumentToIndex(TESTING_INDEX_B, undefined, { message: 'This is a test.' });
      cy.insertDocumentToRemoteIndex(TESTING_INDEX_A, undefined, { message: 'This is a test.' });
      cy.insertDocumentToRemoteIndex(TESTING_INDEX_B, undefined, { message: 'This is a test.' });
    });

    beforeEach(() => {
      // Set welcome screen tracking to false
      localStorage.setItem('home:welcome:show', 'false');

      // Visit Alerting OpenSearch Dashboards
      cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors`);

      // Common text to wait for to confirm page loaded, give up to 20 seconds for initial load
      cy.contains('Create monitor', { timeout: 20000 });
    });

    describe('can be created', () => {
      beforeEach(() => {
        cy.deleteAllMonitors();
        cy.reload();
      });

      it('by extraction query', () => {
        // Confirm we loaded empty monitor list
        cy.contains('There are no existing monitors');

        // Route us to create monitor page
        cy.contains('Create monitor').click({ force: true });

        // Select the Query-Level Monitor type
        cy.get('[data-test-subj="queryLevelMonitorRadioCard"]').click();

        // Select extraction query for method of definition
        cy.get('[data-test-subj="extractionQueryEditorRadioCard"]').click();

        // Wait for input to load and then type in the monitor name
        cy.get('input[name="name"]').type(SAMPLE_MONITOR, { force: true });

        // Wait for input to load and then type in the index name
        cy.get('#index').type(`*:${TESTING_INDEX_A}`, { force: true });

        // Add a trigger
        cy.contains('Add trigger').click({ force: true });

        // Type in the trigger name
        cy.get('input[name="triggerDefinitions[0].name"]').type(SAMPLE_TRIGGER, { force: true });

        // Click the create button
        cy.get('button').contains('Create').click({ force: true });

        // Confirm we can see only one row in the trigger list by checking <caption> element
        cy.contains('This table contains 1 row');

        // Confirm we can see the new trigger
        cy.contains(SAMPLE_TRIGGER);

        // Go back to the Monitors list
        cy.get('a').contains('Monitors').click({ force: true });

        // Confirm we can see the created monitor in the list
        cy.contains(SAMPLE_MONITOR);
      });

      it('with local and remote indices', () => {
        // Confirm we loaded empty monitor list
        cy.contains('There are no existing monitors');

        // Route us to create monitor page
        cy.contains('Create monitor').click({ force: true });

        // Select the Query-Level Monitor type
        cy.get('[data-test-subj="queryLevelMonitorRadioCard"]').click();

        // Select extraction query for method of definition
        cy.get('[data-test-subj="extractionQueryEditorRadioCard"]').click();

        // Wait for input to load and then type in the monitor name
        cy.get('input[name="name"]').type(SAMPLE_MONITOR, { force: true });

        // Wait for input to load and then type in the index name
        cy.get('#index')
          .click({ force: true })
          .type(`${TESTING_INDEX_A}{enter}*:${TESTING_INDEX_B}{enter}`, {
            force: true,
          })
          .trigger('blur', { force: true });

        // Add a trigger
        cy.contains('Add trigger').click({ force: true });

        // Type in the trigger name
        cy.get('input[name="triggerDefinitions[0].name"]').type(SAMPLE_TRIGGER, { force: true });

        // Click the create button
        cy.get('button').contains('Create').click({ force: true });

        // Confirm we can see only one row in the trigger list by checking <caption> element
        cy.contains('This table contains 1 row');

        // Confirm we can see the new trigger
        cy.contains(SAMPLE_TRIGGER);

        // Go back to the Monitors list
        cy.get('a').contains('Monitors').click({ force: true });

        // Confirm we can see the created monitor in the list
        cy.contains(SAMPLE_MONITOR);
      });
    });

    describe('can be updated', () => {
      beforeEach(() => {
        cy.deleteAllMonitors();
        cy.createMonitor(sampleQueryLevelRemoteMonitor);
        cy.reload();
      });

      it('by changing the name', () => {
        // Confirm we can see the created monitor in the list
        cy.contains(SAMPLE_MONITOR, { timeout: 20000 });

        // Select the existing monitor
        cy.get(`[data-test-subj="${SAMPLE_MONITOR}"]`).click();

        // Click Edit button
        cy.contains('Edit', { timeout: 20000 }).click({ force: true });

        // Wait for input to load and then type in the new monitor name
        cy.get('input[name="name"]')
          .should('have.value', SAMPLE_MONITOR)
          .clear()
          .type(UPDATED_MONITOR, { force: true });

        // Click Update button
        cy.get('button').contains('Update').last().click({ force: true });

        // Confirm the update process is done and the page loaded
        cy.contains('Edit monitor');

        // Go back to the Monitors list
        cy.get('a').contains('Monitors').click({ force: true });

        // Confirm we can see the updated monitor in the list
        cy.contains(UPDATED_MONITOR);
      });

      it('to have multiple indices', () => {
        // Confirm we can see the created monitor in the list
        cy.contains(SAMPLE_MONITOR, { timeout: 20000 });

        // Select the existing monitor
        cy.get(`[data-test-subj="${SAMPLE_MONITOR}"]`).click({ force: true });

        // Click Edit button
        cy.contains('Edit', { timeout: 20000 }).click({ force: true });

        // Click on the Index field and type in multiple index names to replicate the bug
        cy.get('#index')
          .click({ force: true })
          .type(`*:${TESTING_INDEX_A}{enter}*:${TESTING_INDEX_B}{enter}`, {
            force: true,
          })
          .trigger('blur', { force: true });

        // Confirm Index field only contains the expected text
        cy.get('[data-test-subj="indicesComboBox"]').contains('*', { timeout: 20000 });
        cy.get('[data-test-subj="indicesComboBox"]').contains(TESTING_INDEX_A, {
          timeout: 20000,
        });
        cy.get('[data-test-subj="indicesComboBox"]').contains(TESTING_INDEX_B, {
          timeout: 20000,
        });

        // Click the update button
        cy.get('button').contains('Update').last().click();

        // Confirm we're on the Monitor Details page by searching for the History element
        cy.contains('History', { timeout: 20000 });
      });
    });

    describe('can be deleted', () => {
      before(() => {
        cy.deleteAllMonitors();
        cy.createMonitor(sampleQueryLevelRemoteMonitor);
      });

      it('from "Actions" menu', () => {
        // Confirm we can see the created monitor in the list
        cy.contains(SAMPLE_MONITOR);

        // Select checkbox for the existing monitor
        cy.get('input[data-test-subj^="checkboxSelectRow-"]').click({ force: true });

        // Click Actions button to open the actions menu
        cy.contains('Actions').click({ force: true });

        // Click the Delete button
        cy.contains('Delete').click({ force: true });
        cy.wait(1000);
        cy.get('[data-test-subj="confirmModalConfirmButton"]').click({ force: true });

        // Confirm we can see an empty monitor list
        cy.contains('There are no existing monitors');
      });
    });

    describe('can be searched', () => {
      before(() => {
        cy.deleteAllMonitors();
        // Create 21 monitors so that a monitor will not appear in the first page
        for (let i = 0; i < 20; i++) {
          cy.createMonitor(sampleQueryLevelRemoteMonitor);
        }
        cy.createMonitor(sampleQueryLevelRemoteMonitorWithAlwaysTrueTrigger);
      });

      it('by name', () => {
        // Sort the table by monitor name in alphabetical order
        cy.get('thead > tr > th').contains('Monitor name').click({ force: true });

        // Confirm the monitor with a different name does not exist
        cy.contains(SAMPLE_MONITOR_WITH_ANOTHER_NAME).should('not.exist');

        // Type in monitor name in search box
        cy.get(`input[type="search"]`).focus().type(SAMPLE_MONITOR_WITH_ANOTHER_NAME);

        // Confirm we filtered down to our one and only monitor
        cy.get('tbody > tr').should(($tr) => {
          expect($tr, '1 row').to.have.length(1);
          expect($tr, 'item').to.contain(SAMPLE_MONITOR_WITH_ANOTHER_NAME);
        });
      });
    });
    after(() => {
      // Delete all existing monitors and destinations
      cy.deleteAllMonitors();

      // Delete sample data
      cy.deleteIndexByName(TESTING_INDEX_A);
      cy.deleteIndexByName(TESTING_INDEX_B);
      cy.deleteRemoteIndexByName(TESTING_INDEX_A);
      cy.deleteRemoteIndexByName(TESTING_INDEX_B);
    });
  });
}
