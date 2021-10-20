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

import { INDEX, PLUGIN_NAME } from '../support/constants';
import sampleAggregationQuery from '../fixtures/sample_aggregation_query';
import sampleDestination from '../fixtures/sample_destination_custom_webhook';
import sampleExtractionQueryMonitor from '../fixtures/sample_extraction_query_bucket_level_monitor';
import sampleVisualEditorMonitor from '../fixtures/sample_visual_editor_bucket_level_monitor';

const SAMPLE_EXTRACTION_QUERY_MONITOR = 'sample_extraction_query_bucket_level_monitor';
const SAMPLE_VISUAL_EDITOR_MONITOR = 'sample_visual_editor_bucket_level_monitor';
const UPDATED_MONITOR = 'updated_bucket_level_monitor';
const SAMPLE_TRIGGER = 'sample_trigger';
const SAMPLE_ACTION = 'sample_action';

const TIME_FIELD = 'order_date';
const COUNT_METRIC_FIELD = 'products.quantity';
const AVERAGE_METRIC_FIELD = 'products.base_price';
const GROUP_BY_FIELD = 'user';
const COUNT_METRIC_NAME = 'count_products_quantity';
const AVERAGE_METRIC_NAME = 'avg_products_base_price';

const addTriggerToVisualEditorMonitor = (triggerName, triggerIndex, actionName, isEdit) => {
  // Add a trigger
  cy.contains('Add trigger').click({ force: true });

  // If the monitor is being edited, the trigger accordion will be closed by default
  // In this case, click on the accordion to open it before proceeding
  if (isEdit === true) {
    // TODO: Passing button props in EUI accordion was added in newer versions (31.7.0+).
    //  If this ever becomes available, it can be used to pass data-test-subj for the button.
    // Since the above is currently not possible, referring to the accordion button using its content
    cy.get('button').contains('New trigger').click();
  }

  // Type in the trigger name
  cy.get(`input[name="triggerDefinitions[${triggerIndex}].name"]`).type(triggerName);

  // Edit the first metric condition for the trigger
  cy.get(`[name="triggerDefinitions[${triggerIndex}].triggerConditions[0].queryMetric"]`).select(
    `${AVERAGE_METRIC_NAME}`
  );

  cy.get(`[name="triggerDefinitions[${triggerIndex}].triggerConditions[0].thresholdValue"]`)
    .clear()
    .type('200');

  // Add another metric condition for the trigger
  cy.get('[data-test-subj="addTriggerConditionButton"]').click();

  cy.get(`[name="triggerDefinitions[${triggerIndex}].triggerConditions[1].andOrCondition"]`).select(
    'OR'
  );

  cy.get(`[name="triggerDefinitions[${triggerIndex}].triggerConditions[1].queryMetric"]`).select(
    `${COUNT_METRIC_NAME}`
  );

  cy.get(`[name="triggerDefinitions[${triggerIndex}].triggerConditions[1].thresholdEnum"]`).select(
    'IS BELOW'
  );

  cy.get(`[name="triggerDefinitions[${triggerIndex}].triggerConditions[1].thresholdValue"]`)
    .clear()
    .type('300');

  // Add a trigger where filter
  cy.get(`[data-test-subj="triggerDefinitions[${triggerIndex}].where.addFilterButton"]`).click();

  cy.get(`[name="triggerDefinitions[${triggerIndex}].where.fieldName"]`).type(
    `${GROUP_BY_FIELD}{downarrow}{enter}`
  );

  cy.get(`[name="triggerDefinitions[${triggerIndex}].where.operator"]`).select('includes');

  cy.get(`[name="triggerDefinitions[${triggerIndex}].where.fieldValue"]`)
    .type('a*')
    .trigger('blur', { force: true });

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

describe('Bucket-Level Monitors', () => {
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

    it('by extraction query', () => {
      // Confirm empty monitor list is loaded
      cy.contains('There are no existing monitors');

      // Go to create monitor page
      cy.contains('Create monitor').click();

      // Select the Bucket-Level Monitor type
      cy.get('[data-test-subj="bucketLevelMonitorRadioCard"]').click();

      // Select extraction query for method of definition
      cy.get('[data-test-subj="extractionQueryEditorRadioCard"]').click();

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_EXTRACTION_QUERY_MONITOR);

      // Wait for input to load and then type in the index name
      cy.get('#index').type('*{enter}', { force: true });

      // Input extraction query
      cy.get('[data-test-subj="extractionQueryCodeEditor"]').within(() => {
        // If possible, a data-test-subj attribute should be added to access the code editor input directly
        cy.get('.ace_text-input')
          .focus()
          .clear({ force: true })
          .type(JSON.stringify(sampleAggregationQuery), {
            force: true,
            parseSpecialCharSequences: false,
            delay: 5,
            timeout: 20000,
          })
          .trigger('blur', { force: true });
      });

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
      cy.contains(SAMPLE_EXTRACTION_QUERY_MONITOR);
    });

    it('by visual editor', () => {
      // Confirm empty monitor list is loaded
      cy.contains('There are no existing monitors');

      // Go to create monitor page
      cy.contains('Create monitor').click();

      // Select the Bucket-Level Monitor type
      cy.get('[data-test-subj="bucketLevelMonitorRadioCard"]').click();

      // Select visual editor for method of definition
      cy.get('[data-test-subj="visualEditorRadioCard"]').click();

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_VISUAL_EDITOR_MONITOR);

      // Wait for input to load and then type in the index name
      // Pressing enter at the end to create combo box entry and trigger change events for time field below
      cy.get('#index').type(`${INDEX.SAMPLE_DATA_ECOMMERCE}{enter}`, { force: true });

      // Select 'order_date' as the timeField for the data source index
      cy.get('#timeField').type(`${TIME_FIELD}{downArrow}{enter}`, { force: true });

      // Add a metric for the query
      cy.get('[data-test-subj="addMetricButton"]').click();

      cy.get('[data-test-subj="metrics.0.aggregationTypeSelect"]').select('count');

      cy.get('[data-test-subj="metrics.0.ofFieldComboBox"]').type(
        `${COUNT_METRIC_FIELD}{downArrow}{enter}`
      );

      cy.get('button').contains('Save').click();

      // Add a second metric for the query
      cy.get('[data-test-subj="addMetricButton"]').click();

      cy.get('[data-test-subj="metrics.1.aggregationTypeSelect"]').select('avg');

      cy.get('[data-test-subj="metrics.1.ofFieldComboBox"]').type(
        `${AVERAGE_METRIC_FIELD}{downArrow}{enter}`
      );

      cy.get('button').contains('Save').click();

      // Add a group by field for the query
      cy.get('[data-test-subj="addGroupByButton"]').click();

      cy.get('[data-test-subj="groupBy.0.ofFieldComboBox"]').type(
        `${GROUP_BY_FIELD}{downArrow}{enter}`
      );

      cy.get('button').contains('Save').click();

      // Add trigger
      addTriggerToVisualEditorMonitor(SAMPLE_TRIGGER, 0, SAMPLE_ACTION, false);

      // Click the create button
      cy.get('button').contains('Create').click();

      // Confirm we can see only one row in the trigger list by checking <caption> element
      cy.contains('This table contains 1 row');

      // Confirm we can see the new trigger
      cy.contains(SAMPLE_TRIGGER);

      // Go back to the Monitors list
      cy.get('a').contains('Monitors').click({ force: true });

      // Confirm we can see the created monitor in the list
      cy.contains(SAMPLE_VISUAL_EDITOR_MONITOR);
    });
  });

  describe('can be updated', () => {
    beforeEach(() => {
      cy.deleteAllMonitors();
    });

    describe('when defined by extraction query', () => {
      beforeEach(() => {
        cy.createMonitor(sampleExtractionQueryMonitor);
      });

      // by adding trigger
      it('by adding trigger', () => {});
    });

    describe('when defined by visual editor', () => {
      beforeEach(() => {
        cy.createMonitor(sampleVisualEditorMonitor);
        cy.reload();
      });

      it('by adding trigger', () => {
        // Confirm the created monitor can be seen
        cy.contains(SAMPLE_VISUAL_EDITOR_MONITOR);

        // Select the monitor
        cy.get('a').contains(SAMPLE_VISUAL_EDITOR_MONITOR).click({ force: true });

        // Click Edit button
        cy.contains('Edit').click({ force: true });

        // Add a trigger
        addTriggerToVisualEditorMonitor(SAMPLE_TRIGGER, 0, SAMPLE_ACTION, true);

        // Click update button to save monitor changes
        cy.get('button').contains('Update').last().click({ force: true });

        // Confirm we can see only one row in the trigger list by checking <caption> element
        cy.contains('This table contains 1 row');
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
