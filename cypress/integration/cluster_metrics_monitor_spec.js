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
import sampleClusterMetricsMonitor from '../fixtures/sample_cluster_metrics_monitor.json';
import { INDEX, PLUGIN_NAME } from '../../cypress/support/constants';

const SAMPLE_CLUSTER_METRICS_HEALTH_MONITOR = 'sample_cluster_metrics_health_monitor';
const SAMPLE_CLUSTER_METRICS_NODES_STATS_MONITOR = 'sample_cluster_metrics_nodes_stats_monitor';
const SAMPLE_CLUSTER_METRICS_CAT_SNAPSHOTS_MONITOR = 'sample_cluster_metrics_cat_snapshots_monitor';
const SAMPLE_TRIGGER = 'sample_trigger';
const SAMPLE_ACTION = 'sample_action';
const SAMPLE_DESTINATION = 'sample_destination';

const addClusterMetricsTrigger = (triggerName, triggerIndex, actionName, isEdit, source) => {
  // Click 'Add trigger' button
  cy.contains('Add trigger', { timeout: 20000 }).click({ force: true });

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
  cy.get(`[data-test-subj="triggerDefinitions[${triggerIndex}].actions.0_actionDestination"]`)
    .click({ force: true })
    .type(`${SAMPLE_DESTINATION}{downarrow}{enter}`);
};

describe('ClusterMetricsMonitor', () => {
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

      // Select ClusterMetrics radio card
      cy.get('[data-test-subj="clusterMetricsMonitorRadioCard"]').click();

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_CLUSTER_METRICS_HEALTH_MONITOR);

      // Wait for the API types to load and then type in the Cluster Health API
      cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').type('cluster health{enter}');

      // Confirm the Query parameters field is present and described as "optional"
      cy.contains('Query parameters - optional');
      cy.get('[data-test-subj="clusterMetricsParamsFieldText"]');

      // Press the 'Run for response' button
      cy.get('[data-test-subj="clusterMetricsPreviewButton"]').click();

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
      cy.contains(SAMPLE_CLUSTER_METRICS_HEALTH_MONITOR);
    });

    it('for the Nodes Stats API', () => {
      // Confirm empty monitor list is loaded
      cy.contains('There are no existing monitors');

      // Go to create monitor page
      cy.contains('Create monitor').click();

      // Select ClusterMetrics radio card
      cy.get('[data-test-subj="clusterMetricsMonitorRadioCard"]').click();

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_CLUSTER_METRICS_NODES_STATS_MONITOR);

      // Wait for the API types to load and then type in the Cluster Health API
      cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').type('nodes stats{enter}');

      // Confirm the Query parameters field is not present
      cy.contains('Query parameters').should('not.exist');
      cy.get('[data-test-subj="clusterMetricsParamsFieldText"]').should('not.exist');

      // Press the 'Run for response' button
      cy.get('[data-test-subj="clusterMetricsPreviewButton"]').click();

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
      cy.contains(SAMPLE_CLUSTER_METRICS_NODES_STATS_MONITOR);
    });
  });

  describe('displays Query parameters field appropriately', () => {
    beforeEach(() => {
      cy.deleteAllMonitors();
      cy.reload();
    });

    it('for the CAT Snapshots API', () => {
      // Confirm empty monitor list is loaded
      cy.contains('There are no existing monitors');

      // Go to create monitor page
      cy.contains('Create monitor').click();

      // Select ClusterMetrics radio card
      cy.get('[data-test-subj="clusterMetricsMonitorRadioCard"]').click();

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_CLUSTER_METRICS_CAT_SNAPSHOTS_MONITOR);

      // Wait for the API types to load and then type in the Cluster Health API
      cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').type('cat snapshots{enter}');

      // Confirm the Query parameters field is present and is not described as "optional"
      cy.contains('Query parameters - optional').should('not.exist');
      cy.contains('Query parameters');
      cy.get('[data-test-subj="clusterMetricsParamsFieldText"]');
    });
  });

  describe('clearTriggersModal renders and behaves as expected', () => {
    beforeEach(() => {
      // Visit Alerting OpenSearch Dashboards
      cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors`);

      // Begin monitor creation
      // Confirm empty monitor list is loaded
      cy.contains('There are no existing monitors');

      // Go to create monitor page
      cy.contains('Create monitor').click();

      // Select ClusterMetrics radio card
      cy.get('[data-test-subj="clusterMetricsMonitorRadioCard"]').click();

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_CLUSTER_METRICS_HEALTH_MONITOR);
    });

    it('when no triggers exist', () => {
      // Confirm there are 0 triggers defined
      cy.contains('Triggers (0)');

      describe('blank API type is defined', () => {
        // Select the Cluster Health API
        cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').type('cluster health{enter}');

        // Confirm clearTriggersModal is not displayed
        cy.get('[data-test-subj="clusterMetricsClearTriggersModal"]').should('not.exist');
      });

      describe('API type is changed', () => {
        // Change the API type to Cluster Stats
        cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').type('cluster stats{enter}');

        // Confirm clearTriggersModal is not displayed
        cy.get('[data-test-subj="clusterMetricsClearTriggersModal"]').should('not.exist');
      });
    });

    it('when triggers exist', () => {
      // Add a trigger for testing purposes
      addClusterMetricsTrigger(
        SAMPLE_TRIGGER,
        0,
        SAMPLE_ACTION,
        false,
        'ctx.results[0].number_of_pending_tasks >= 0'
      );

      // Confirm there is 1 trigger defined
      cy.contains('Triggers (1)');

      describe('blank API type is defined', () => {
        // Select the Cluster Health API
        cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').type('cluster health{enter}');

        // Confirm clearTriggersModal did not open
        cy.get('[data-test-subj="clusterMetricsClearTriggersModal"]').should('not.exist');
      });

      describe('API type is changed', () => {
        // Change the API type to Cluster Stats
        cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').type('cluster stats{enter}');

        // Confirm clearTriggersModal displays appropriate text
        cy.contains(
          'You are about to change the request type. The existing trigger conditions may not be supported. Would you like to clear the existing trigger conditions?'
        );
      });

      describe('the modal CLOSE (i.e., the X button) button is clicked', () => {
        // Click the CLOSE button
        cy.get('[class="euiButtonIcon euiButtonIcon--text euiModal__closeIcon"]').click();

        // Confirm clearTriggersModal closed
        cy.get('[data-test-subj="clusterMetricsClearTriggersModal"]').should('not.exist');

        // Confirm API type reverted back to Cluster Health
        cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').contains('Cluster Health');

        // Confirm there is 1 trigger defined
        cy.contains('Triggers (1)');
      });

      describe('the modal KEEP button is clicked', () => {
        // Change the API type to Cluster Stats
        cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').type('cluster stats{enter}');

        // Click the KEEP button
        cy.get('[data-test-subj="clusterMetricsClearTriggersModalKeepButton"]').click();

        // Confirm clearTriggersModal closed
        cy.get('[data-test-subj="clusterMetricsClearTriggersModal"]').should('not.exist');

        // Confirm there is 1 trigger defined
        cy.contains('Triggers (1)');
      });

      describe('the modal CLEAR button is clicked', () => {
        // Change the API type to Cluster Settings
        cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').type('cluster settings{enter}');

        // Click the CLEAR button
        cy.get('[data-test-subj="clusterMetricsClearTriggersModalClearButton"]').click();

        // Confirm clearTriggersModal closed
        cy.get('[data-test-subj="clusterMetricsClearTriggersModal"]').should('not.exist');

        // Confirm API type changed to Cluster Stats
        cy.get('[data-test-subj="clusterMetricsApiTypeComboBox"]').contains('Cluster Settings');

        // Confirm there are 0 triggers defined
        cy.contains('Triggers (0)', { timeout: 20000 });
      });
    });
  });

  describe('can update', () => {
    beforeEach(() => {
      cy.deleteAllMonitors();
    });

    describe('Cluster Health API monitor', () => {
      it('with a new trigger', () => {
        // Create the sample monitor
        cy.createMonitor(sampleClusterMetricsMonitor);
        cy.reload();

        // Confirm the created monitor can be seen
        cy.contains(SAMPLE_CLUSTER_METRICS_HEALTH_MONITOR);

        // Select the monitor
        cy.get('a').contains(SAMPLE_CLUSTER_METRICS_HEALTH_MONITOR).click({ force: true });

        // Click Edit button
        cy.contains('Edit').click({ force: true });

        // Add a trigger
        addClusterMetricsTrigger(
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
