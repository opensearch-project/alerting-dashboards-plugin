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
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import sampleDestination from '../fixtures/sample_destination_custom_webhook';
import sampleLocalUriMonitor from '../fixtures/sample_local_uri_cluster_health_monitor';
import { INDEX, PLUGIN_NAME } from '../../cypress/support/constants';

const SAMPLE_LOCAL_URI_CLUSTER_HEALTH_MONITOR = 'sample_local_uri_cluster_health_monitor';
const SAMPLE_LOCAL_URI_NODES_STATS_MONITOR = 'sample_local_uri_nodes_stats_monitor';
const SAMPLE_LOCAL_URI_CAT_SNAPSHOTS_MONITOR = 'sample_local_uri_cat_snapshots_monitor';
const SAMPLE_TRIGGER = 'sample_trigger';
const SAMPLE_ACTION = 'sample_action';

const addLocalUriTrigger = (triggerName, triggerIndex, actionName, isEdit, source) => {
  // Click 'Add trigger' button
  cy.contains('Add trigger').click({ force: true });

  if (isEdit === true) {
    // TODO: Passing button props in EUI accordion was added in newer versions (31.7.0+).
    //  If this ever becomes available, it can be used to pass data-test-subj for the button.
    // Since the above is currently not possible, referring to the accordion button using its content
    cy.get('button').contains('New trigger').click();
  }

  // Type in the trigger name
  cy.get(`input[name="triggerDefinitions[${triggerIndex}].name"]`).type(triggerName);

  // Clear the default trigger condition source, and type the sample source
  cy.get('[data-test-subj="triggerQueryCodeEditor"]').within(() => {
    // If possible, a data-test-subj attribute should be added to access the code editor input directly
    cy.get('.ace_text-input')
      .focus()
      .clear({ force: true })
      .type(JSON.stringify(source), {
        force: true,
        parseSpecialCharSequences: false,
        delay: 5,
        timeout: 20000,
      })
      .trigger('blur', { force: true });
  });

  // Type in the action name
  cy.get(`input[name="triggerDefinitions[${triggerIndex}].actions.0.name"]`).type(actionName, {
    force: true,
  });

  // Click the combo box to list all the destinations
  // Using key typing instead of clicking the menu option to avoid occasional failure
  cy.get(`div[name="triggerDefinitions[${triggerIndex}].actions.0.destination_id"]`)
    .click({ force: true })
    .type('{downarrow}{enter}');
};

describe('LocalUriInput Monitors', () => {
  before(() => {
    cy.createDestination(sampleDestination);

    // Load sample data
    cy.loadSampleEcommerceData();
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

    it('for the Cluster Health API', () => {
      // Confirm empty monitor list is loaded
      cy.contains('There are no existing monitors');

      // Go to create monitor page
      cy.contains('Create monitor').click();

      // Ensure the Query-level monitor type is selected
      cy.get('[data-test-subj="queryLevelMonitorRadioCard"]').click();

      // Select LocalUri radio card
      cy.get('[data-test-subj="localUriRadioCard"]').click();

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_LOCAL_URI_CLUSTER_HEALTH_MONITOR);

      // Wait for the API types to load and then type in the Cluster Health API
      cy.get('[data-test-subj="localUriApiTypeComboBox"]').type('cluster health{enter}');

      // Confirm the path parameters field is present and described as "optional"
      cy.contains('Path parameters - optional');
      cy.get('[data-test-subj="localUriPathParamsFieldText"]');

      // Press the 'Run for response' button
      cy.get('[data-test-subj="localUriRunButton"]').click();

      // Add a trigger
      cy.contains('Add trigger').click({ force: true });

      // Type in the trigger name
      cy.get('input[name="triggerDefinitions[0].name"]').type(SAMPLE_TRIGGER);

      // Type in the action name
      cy.get('input[name="triggerDefinitions[0].actions.0.name"]').type(SAMPLE_ACTION);

      // Click the combo box to list all the destinations
      // Using key typing instead of clicking the menu option to avoid occasional failure
      cy.get('div[name="triggerDefinitions[0].actions.0.destination_id"]')
        .click({ force: true })
        .type('{downarrow}{enter}');

      // Click the create button
      cy.get('button').contains('Create').click();

      // Confirm we can see only one row in the trigger list by checking <caption> element
      cy.contains('This table contains 1 row');

      // Confirm we can see the new trigger
      cy.contains(SAMPLE_TRIGGER);

      // Go back to the Monitors list
      cy.get('a').contains('Monitors').click();

      // Confirm we can see the created monitor in the list
      cy.contains(SAMPLE_LOCAL_URI_CLUSTER_HEALTH_MONITOR);
    });

    it('for the Nodes Stats API', () => {
      // Confirm empty monitor list is loaded
      cy.contains('There are no existing monitors');

      // Go to create monitor page
      cy.contains('Create monitor').click();

      // Ensure the Query-level monitor type is selected
      cy.get('[data-test-subj="queryLevelMonitorRadioCard"]').click();

      // Select LocalUri radio card
      cy.get('[data-test-subj="localUriRadioCard"]').click();

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_LOCAL_URI_NODES_STATS_MONITOR);

      // Wait for the API types to load and then type in the Cluster Health API
      cy.get('[data-test-subj="localUriApiTypeComboBox"]').type('nodes stats{enter}');

      // Confirm the path parameters field is not present
      cy.contains('Path parameters').should('not.exist');
      cy.get('[data-test-subj="localUriPathParamsFieldText"]').should('not.exist');

      // Press the 'Run for response' button
      cy.get('[data-test-subj="localUriRunButton"]').click();

      // Add a trigger
      cy.contains('Add trigger').click({ force: true });

      // Type in the trigger name
      cy.get('input[name="triggerDefinitions[0].name"]').type(SAMPLE_TRIGGER);

      // Type in the action name
      cy.get('input[name="triggerDefinitions[0].actions.0.name"]').type(SAMPLE_ACTION);

      // Click the combo box to list all the destinations
      // Using key typing instead of clicking the menu option to avoid occasional failure
      cy.get('div[name="triggerDefinitions[0].actions.0.destination_id"]')
        .click({ force: true })
        .type('{downarrow}{enter}');

      // Click the create button
      cy.get('button').contains('Create').click();

      // Confirm we can see only one row in the trigger list by checking <caption> element
      cy.contains('This table contains 1 row');

      // Confirm we can see the new trigger
      cy.contains(SAMPLE_TRIGGER);

      // Go back to the Monitors list
      cy.get('a').contains('Monitors').click();

      // Confirm we can see the created monitor in the list
      cy.contains(SAMPLE_LOCAL_URI_NODES_STATS_MONITOR);
    });
  });

  describe('displays path parameters field appropriately', () => {
    beforeEach(() => {
      cy.deleteAllMonitors();
      cy.reload();
    });

    it('for the CAT Snapshots API', () => {
      // Confirm empty monitor list is loaded
      cy.contains('There are no existing monitors');

      // Go to create monitor page
      cy.contains('Create monitor').click();

      // Ensure the Query-level monitor type is selected
      cy.get('[data-test-subj="queryLevelMonitorRadioCard"]').click();

      // Select LocalUri radio card
      cy.get('[data-test-subj="localUriRadioCard"]').click();

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_LOCAL_URI_CAT_SNAPSHOTS_MONITOR);

      // Wait for the API types to load and then type in the Cluster Health API
      cy.get('[data-test-subj="localUriApiTypeComboBox"]').type('cat snapshots{enter}');

      // Confirm the path parameters field is present and is not described as "optional"
      cy.contains('Path parameters - optional').should('not.exist');
      cy.contains('Path parameters');
      cy.get('[data-test-subj="localUriPathParamsFieldText"]');
    });
  });

  describe('can update', () => {
    beforeEach(() => {
      cy.deleteAllMonitors();
    });

    describe('Cluster Health API monitor', () => {
      it('with a new trigger', () => {
        // Create the sample monitor
        cy.createMonitor(sampleLocalUriMonitor);
        cy.reload();

        // Confirm the created monitor can be seen
        cy.contains(SAMPLE_LOCAL_URI_CLUSTER_HEALTH_MONITOR);

        // Select the monitor
        cy.get('a').contains(SAMPLE_LOCAL_URI_CLUSTER_HEALTH_MONITOR).click({ force: true });

        // Click Edit button
        cy.contains('Edit').click({ force: true });

        // Add a trigger
        addLocalUriTrigger(
          SAMPLE_TRIGGER,
          0,
          SAMPLE_ACTION,
          true,
          'ctx.results[0].number_of_pending_tasks >= 0'
        );

        // Click update button to save monitor changes
        cy.get('button').contains('Update').last().click({ force: true });

        // Confirm we can see only one row in the trigger list by checking <caption> element
        cy.contains('This table contains 1 row');

        // Confirm we can see the new trigger
        cy.contains(SAMPLE_TRIGGER);
      });
    });
  });

  after(() => {
    // Delete all monitors and destinations
    cy.deleteAllMonitors();
    cy.deleteAllDestinations();

    // Delete sample data
    cy.deleteIndexByName(`${INDEX.SAMPLE_DATA_ECOMMERCE}`);
  });
});
