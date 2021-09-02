/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import { PLUGIN_NAME } from '../support/constants';
import sampleQueryLevelMonitor from '../fixtures/sample_query_level_monitor';
import sampleQueryLevelMonitorWithAlwaysTrueTrigger from '../fixtures/sample_query_level_monitor_with_always_true_trigger';
import sampleDestination from '../fixtures/sample_destination_custom_webhook.json';

const SAMPLE_MONITOR = 'sample_query_level_monitor';
const UPDATED_MONITOR = 'updated_query_level_monitor';
const SAMPLE_MONITOR_WITH_ANOTHER_NAME = 'sample_query_level_monitor_with_always_true_trigger';
const SAMPLE_TRIGGER = 'sample_trigger';
const SAMPLE_ACTION = 'sample_action';

describe('Query-Level Monitors', () => {
  beforeEach(() => {
    // Set welcome screen tracking to false
    localStorage.setItem('home:welcome:show', 'false');

    // Visit Alerting OpenSearch Dashboards
    cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors`);

    // Common text to wait for to confirm page loaded, give up to 20 seconds for initial load
    cy.contains('Create monitor', { timeout: 20000 });
  });

  describe('can be created', () => {
    before(() => {
      cy.deleteAllMonitors();
      cy.createDestination(sampleDestination);
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
      cy.get('#index').type('*', { force: true });

      // Add a trigger
      cy.contains('Add trigger').click({ force: true });

      // Type in the trigger name
      cy.get('input[name="triggerDefinitions[0].name"]').type(SAMPLE_TRIGGER, { force: true });

      // Type in the action name
      cy.get('input[name="triggerDefinitions[0].actions.0.name"]').type(SAMPLE_ACTION, {
        force: true,
      });

      // Click the combo box to list all the destinations
      // Using key typing instead of clicking the menu option to avoid occasional failure
      cy.get('div[name="triggerDefinitions[0].actions.0.destination_id"]')
        .click({ force: true })
        .type('{downarrow}{enter}');

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
    before(() => {
      cy.deleteAllMonitors();
      cy.createMonitor(sampleQueryLevelMonitor);
    });

    it('by changing the name', () => {
      // Confirm we can see the created monitor in the list
      cy.contains(SAMPLE_MONITOR);

      // Select the existing monitor
      cy.get('a').contains(SAMPLE_MONITOR).click({ force: true });

      // Click Edit button
      cy.contains('Edit').click({ force: true });

      // Wait for input to load and then type in the new monitor name
      cy.get('input[name="name"]')
        .should('have.value', SAMPLE_MONITOR)
        .clear()
        .type(UPDATED_MONITOR, { force: true });

      // Click Update button
      cy.get('button').contains('Update').last().click({ force: true });

      // Confirm the update process is done and the page loaded
      cy.contains('Create trigger');

      // Go back to the Monitors list
      cy.get('a').contains('Monitors').click({ force: true });

      // Confirm we can see the updated monitor in the list
      cy.contains(UPDATED_MONITOR);
    });
  });

  describe('can be deleted', () => {
    before(() => {
      cy.deleteAllMonitors();
      cy.createMonitor(sampleQueryLevelMonitor);
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

      // Confirm we can see an empty monitor list
      cy.contains('There are no existing monitors');
    });
  });

  describe('can be searched', () => {
    before(() => {
      cy.deleteAllMonitors();
      // Create 21 monitors so that a monitor will not appear in the first page
      for (let i = 0; i < 20; i++) {
        cy.createMonitor(sampleQueryLevelMonitor);
      }
      cy.createMonitor(sampleQueryLevelMonitorWithAlwaysTrueTrigger);
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
    cy.deleteAllDestinations();
  });
});
