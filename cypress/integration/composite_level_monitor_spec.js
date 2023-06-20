/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PLUGIN_NAME } from '../support/constants';
import sampleCompositeJson from '../fixtures/sample_composite_level_monitor.json';

const sample_index_1 = 'sample_index_1';
const sample_index_2 = 'sample_index_2';
const SAMPLE_VISUAL_EDITOR_MONITOR = 'sample_visual_editor_composite_level_monitor';
const SAMPLE_COMPOSITE_LEVEL_MONITOR = 'sample_composite_level_monitor';

const clearAll = () => {
  cy.deleteAllMonitors();
  cy.deleteIndexByName(sample_index_1);
  cy.deleteIndexByName(sample_index_2);
  cy.deleteAllAlerts();
};

describe('CompositeLevelMonitor', () => {
  before(() => {
    clearAll();

    // Create indices
    cy.createIndexByName(sample_index_1, sampleCompositeJson.sample_composite_index);
    cy.createIndexByName(sample_index_2, sampleCompositeJson.sample_composite_index);

    // Create asociated monitors
    cy.createMonitor(sampleCompositeJson.sample_composite_associated_monitor_1);
    cy.createMonitor(sampleCompositeJson.sample_composite_associated_monitor_2);
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
      // Go to create monitor page
      cy.contains('Create monitor').click({ force: true });

      // Select the Composite-Level Monitor type
      cy.get('[data-test-subj="compositeLevelMonitorRadioCard"]').click({ force: true });
    });

    it('by visual editor', () => {
      // Select visual editor for method of definition
      cy.get('[data-test-subj="visualEditorRadioCard"]').click({ force: true });

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_VISUAL_EDITOR_MONITOR);

      // Select associated monitors
      cy.get('[data-test-subj="monitors_list_0"]')
        .type(sampleCompositeJson.sample_composite_associated_monitor_1.name)
        .type('{enter}');
      cy.get('[data-test-subj="monitors_list_1"]')
        .type(sampleCompositeJson.sample_composite_associated_monitor_2.name)
        .type('{enter}');

      // Type trigger name
      cy.get('[data-test-subj="composite-trigger-name"]')
        .type('{selectall}')
        .type('{backspace}')
        .type('Composite trigger');

      // Add associated monitors to condition
      cy.get('[data-test-subj="condition-add-selection-btn"]').click();
      cy.get('[data-test-subj="condition-add-selection-btn"]').click();

      // TODO: Test with Notifications plugin
      // Select notification channel
      // cy.get('[title="Notification 1"]').type('Channel name');

      cy.intercept('api/alerting/workflows').as('createMonitorRequest');
      cy.intercept('api/alerting/monitors').as('getMonitorsRequest');
      cy.get('button').contains('Create').click({ force: true });

      // Wait for monitor to be created
      cy.wait('@createMonitorRequest').then((interceptor) => {
        const monitorID = interceptor.response.body.resp._id;

        cy.contains('Loading monitors');
        cy.wait('@getMonitorsRequest');

        // Let monitor's table render the rows before querying
        cy.wait(1000).then(() => {
          cy.get('table tbody td').contains(SAMPLE_VISUAL_EDITOR_MONITOR);

          // Load sample data
          cy.insertDocumentToIndex(
            sample_index_1,
            undefined,
            sampleCompositeJson.sample_composite_associated_index_document
          );
          cy.insertDocumentToIndex(
            sample_index_2,
            undefined,
            sampleCompositeJson.sample_composite_associated_index_document
          );

          cy.wait(1000).then(() => {
            cy.executeCompositeMonitor(monitorID);

            cy.get('[role="tab"]').contains('Alerts').click();
            cy.get('table tbody td').contains('Composite trigger');
          });
        });
      });
    });
  });

  after(() => clearAll());
});
