/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { PLUGIN_NAME } from '../support/constants';
import sampleDocumentLevelMonitor from '../fixtures/sample_document_level_monitor.json';

const TESTING_INDEX = 'document-level-monitor-test-index';
const TESTING_INDEX_A = 'document-level-monitor-test-index-a';
const TESTING_INDEX_B = 'document-level-monitor-test-index-b';
const SAMPLE_EXTRACTION_QUERY_MONITOR = 'sample_extraction_query_document_level_monitor';
const SAMPLE_VISUAL_EDITOR_MONITOR = 'sample_visual_editor_document_level_monitor';
const SAMPLE_DOCUMENT_LEVEL_MONITOR = 'sample_document_level_monitor';

const sampleDocument = {
  message: 'This is an error from IAD region',
  date: '2020-06-04T18:57:12',
  region: 'us-west-2',
  numberField: 100,
};

const queryOperators = [
  {
    text: 'is',
    value: 'is',
  },
  {
    text: 'is not',
    value: 'is_not',
  },
  {
    text: 'is greater than',
    value: 'is_greater',
  },
  {
    text: 'is greater than equal',
    value: 'is_greater_equal',
  },
  {
    text: 'is less than',
    value: 'is_less',
  },
  {
    text: 'is less than equal',
    value: 'is_less_equal',
  },
];

const addDocumentsToTestIndex = (indexName = '', numOfDocs = 0) => {
  for (let i = 0; i < numOfDocs; i++) {
    cy.insertDocumentToIndex(indexName, undefined, sampleDocument);
  }
};

const addQuery = ({ queryIndex = 0, queryName, queryField, operator, query, tags = [] }) => {
  // Add another query
  if (queryIndex > 0) cy.get('[data-test-subj="addDocLevelQueryButton"]').click({ force: true });

  // Enter query name
  cy.get(`[data-test-subj="documentLevelQuery_queryName${queryIndex}"]`).type(queryName);

  // Enter query field
  cy.get(`[data-test-subj="documentLevelQuery_field${queryIndex}"]`).type(
    `${queryField}{downarrow}{enter}`
  );

  // Select query operator
  cy.get(`[data-test-subj="documentLevelQuery_operator${queryIndex}"]`).select(operator);

  // Enter query
  cy.get(`[data-test-subj="documentLevelQuery_query${queryIndex}"]`).type(query);

  // Enter tags
  tags.forEach((tag, tagIndex) => {
    cy.get(`[data-test-subj="addDocLevelQueryTagButton_query${queryIndex}"]`).click({
      force: true,
    });
    cy.get(
      `[data-test-subj="documentLevelQueryTag_text_field_query${queryIndex}_tag${tagIndex}"]`
    ).type(tag);
  });
};

describe('DocumentLevelMonitor', () => {
  before(() => {
    // Load sample data
    addDocumentsToTestIndex(TESTING_INDEX, 5);
    addDocumentsToTestIndex(TESTING_INDEX_A, 1);
    addDocumentsToTestIndex(TESTING_INDEX_B, 1);
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
      // Delete existing monitors
      cy.deleteAllMonitors();
      cy.reload();

      // Confirm empty monitor list is loaded
      cy.contains('There are no existing monitors');

      // Go to create monitor page
      cy.contains('Create monitor').click({ force: true });

      // Select the Document-Level Monitor type
      cy.get('[data-test-subj="docLevelMonitorRadioCard"]').click({ force: true });
    });

    it('by extraction query editor', () => {
      // Select extraction query for method of definition
      cy.get('[data-test-subj="extractionQueryEditorRadioCard"]').click({ force: true });

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_EXTRACTION_QUERY_MONITOR);

      // Wait for input to load and then type in the index name
      cy.get('#index').type(`${TESTING_INDEX}{enter}`, { force: true });

      // Input extraction query
      cy.get('[data-test-subj="extractionQueryCodeEditor"]').within(() => {
        cy.get('.ace_text-input')
          .focus()
          .clear({ force: true })
          .type(JSON.stringify(sampleDocumentLevelMonitor.inputs[0].doc_level_input), {
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
      cy.get('input[name="triggerDefinitions[0].name"]').type(
        sampleDocumentLevelMonitor.triggers[0].document_level_trigger.name
      );

      // Clear the default trigger condition source, and type the sample source
      cy.get('[data-test-subj="triggerQueryCodeEditor"]').within(() => {
        cy.get('.ace_text-input')
          .focus()
          .clear({ force: true })
          .type(
            JSON.stringify(
              sampleDocumentLevelMonitor.triggers[0].document_level_trigger.condition.script.source
            ),
            {
              force: true,
              parseSpecialCharSequences: false,
              delay: 5,
              timeout: 20000,
            }
          )
          .trigger('blur', { force: true });
      });

      // TODO: Test with Notifications plugin

      // Click the create button
      cy.get('button').contains('Create').click({ force: true });

      // Confirm we can see only one row in the trigger list by checking <caption> element
      cy.contains('This table contains 1 row');

      // Confirm we can see the new trigger
      cy.contains(sampleDocumentLevelMonitor.triggers[0].document_level_trigger.name);

      // Go back to the Monitors list
      cy.get('a').contains('Monitors').click({ force: true });

      // Confirm we can see the created monitor in the list
      cy.contains(SAMPLE_EXTRACTION_QUERY_MONITOR);
    });

    it('by visual editor', () => {
      // Select visual editor for method of definition
      cy.get('[data-test-subj="visualEditorRadioCard"]').click({ force: true });

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_VISUAL_EDITOR_MONITOR);

      // Wait for input to load and then type in the index name
      cy.get('#index').type(`${TESTING_INDEX}{enter}`, { force: true });

      const testQueries = [
        {
          queryName: sampleDocumentLevelMonitor.inputs[0].doc_level_input.queries[0].name,
          queryField: 'region',
          operator: 'is',
          operatorValue: 'is',
          query: 'us-west-2',
          tags: [sampleDocumentLevelMonitor.inputs[0].doc_level_input.queries[0].tags[0]],
        },
      ];

      // Enter first query
      addQuery(testQueries[0]);

      // Create queries for each supported query operator
      queryOperators.forEach((operator, index) => {
        // Incrementing the query index by 1 to account for the query created above.
        const queryIndex = index + 1;
        const newQuery = {
          queryIndex: queryIndex,
          queryName: `Query${queryIndex}-${operator.value}`,
          queryField: 'numberField',
          operator: operator.text,
          operatorValue: operator.value,
          query: 1000 + queryIndex,
        };
        addQuery(newQuery);
        testQueries.push(newQuery);
      });

      // Add a trigger
      cy.contains('Add trigger').click({ force: true });

      // Type in the trigger name
      cy.get('input[name="triggerDefinitions[0].name"]').type(
        sampleDocumentLevelMonitor.triggers[0].document_level_trigger.name
      );

      // Define the first condition
      cy.get(
        '[data-test-subj="documentLevelTriggerExpression_query_triggerDefinitions[0].triggerConditions.0"]'
      ).type(
        `${sampleDocumentLevelMonitor.inputs[0].doc_level_input.queries[0].tags[0]}{downarrow}{enter}`
      );

      // Add another condition
      cy.get('[data-test-subj="addTriggerConditionButton"]').click({ force: true });

      // Define a second condition
      cy.get(
        '[data-test-subj="documentLevelTriggerExpression_andOr_triggerDefinitions[0].triggerConditions.1"]'
      ).type('or{enter}');

      cy.get(
        '[data-test-subj="documentLevelTriggerExpression_query_triggerDefinitions[0].triggerConditions.1"]'
      ).type(
        `${sampleDocumentLevelMonitor.inputs[0].doc_level_input.queries[0].name}{downarrow}{enter}`
      );

      // TODO: Test with Notifications plugin

      // Click the create button
      cy.get('button').contains('Create').click({ force: true });

      // Confirm we can see only one row in the trigger list by checking <caption> element
      cy.contains('This table contains 1 row');

      // Confirm we can see the new trigger
      cy.contains(sampleDocumentLevelMonitor.triggers[0].document_level_trigger.name);

      // Click the 'Edit' button to confirm the monitor has the expected configuration
      cy.contains('Edit').click({ force: true });

      // Confirm each query has been configured correctly
      testQueries.forEach((query, index) => {
        // Confirm query name
        cy.get(`[data-test-subj="documentLevelQuery_queryName${index}"]`).should(
          'have.value',
          query.queryName
        );

        // Confirm query field
        cy.get(`[data-test-subj="documentLevelQuery_field${index}"]`).contains(query.queryField);

        // Confirm query operator
        cy.get(`[data-test-subj="documentLevelQuery_operator${index}"]`).should(
          'have.value',
          query.operatorValue
        );

        // Confirm query
        cy.get(`[data-test-subj="documentLevelQuery_query${index}"]`).should(
          'have.value',
          query.query.toString()
        );

        // Confirm tags
        query.tags?.forEach((tag, tagIndex) => {
          cy.get(
            `[data-test-subj="documentLevelQueryTag_badge_query${index}_tag${tagIndex}"]`
          ).contains(tag);
        });
      });

      // Confirm the first trigger condition has been configured correctly
      cy.get(
        '[data-test-subj="documentLevelTriggerExpression_query_triggerDefinitions[0].triggerConditions.0"]'
      ).contains(sampleDocumentLevelMonitor.inputs[0].doc_level_input.queries[0].tags[0]);

      // Confirm the second trigger condition has been configured correctly
      cy.get(
        '[data-test-subj="documentLevelTriggerExpression_andOr_triggerDefinitions[0].triggerConditions.1"]'
      ).contains('OR');
      cy.get(
        '[data-test-subj="documentLevelTriggerExpression_query_triggerDefinitions[0].triggerConditions.1"]'
      ).contains(sampleDocumentLevelMonitor.inputs[0].doc_level_input.queries[0].name);

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

    describe('when defined with extraction query editor', () => {
      it('with a new trigger', () => {
        // Removing ui-metadata so the UX will use the extraction query editor when editing the monitor
        const extractionQueryMonitor = _.omit(_.cloneDeep(sampleDocumentLevelMonitor), [
          'ui_metadata',
        ]);

        // Creating the test monitor
        cy.createMonitor(extractionQueryMonitor);
        cy.reload();

        // Confirm the created monitor can be seen
        cy.contains(SAMPLE_DOCUMENT_LEVEL_MONITOR);

        // Select the monitor
        cy.get('a').contains(SAMPLE_DOCUMENT_LEVEL_MONITOR).click({ force: true });

        // Click Edit button
        cy.contains('Edit').click({ force: true });

        // Add a trigger
        cy.contains('Add another trigger').click({ force: true });

        // Expand the accordion
        cy.contains('New trigger').click({ force: true });

        // Type in the trigger name
        const newTriggerName = 'new-extraction-query-trigger';
        cy.get('input[name="triggerDefinitions[1].name"]').type(newTriggerName);

        // Clear the default trigger condition source, and type the sample source
        cy.get('[data-test-subj="triggerQueryCodeEditor"]')
          .last()
          .within(() => {
            cy.get('.ace_text-input')
              .focus()
              .clear({ force: true })
              .type(
                JSON.stringify(
                  sampleDocumentLevelMonitor.triggers[0].document_level_trigger.condition.script
                    .source
                ),
                {
                  force: true,
                  parseSpecialCharSequences: false,
                  delay: 5,
                  timeout: 20000,
                }
              )
              .trigger('blur', { force: true });
          });

        // TODO: Test with Notifications plugin

        // Click the update button
        cy.get('button').contains('Update').last().click({ force: true });

        // Confirm we can see only one row in the trigger list by checking <caption> element
        cy.contains('This table contains 2 rows');

        // Confirm we can see the new trigger
        cy.contains(newTriggerName);
      });
    });

    describe('when defined with visual editor', () => {
      it('with a new query and a new trigger', () => {
        // Creating the test monitor
        cy.createMonitor(sampleDocumentLevelMonitor);
        cy.reload();

        // Confirm the created monitor can be seen
        cy.contains(SAMPLE_DOCUMENT_LEVEL_MONITOR);

        // Select the monitor
        cy.get('a').contains(SAMPLE_DOCUMENT_LEVEL_MONITOR).click({ force: true });

        // Click Edit button
        cy.contains('Edit').click({ force: true });

        // Add another query
        cy.contains('Add another query').click({ force: true });

        // Enter query name
        const newQueryName = 'new-visual-editor-query';
        cy.get('[data-test-subj="documentLevelQuery_queryName3"]').type(newQueryName);

        // Enter query field
        cy.get('[data-test-subj="documentLevelQuery_field3"]').type('message{downarrow}{enter}');

        // Enter query operator
        cy.get('[data-test-subj="documentLevelQuery_operator3"]').type('is not{enter}');

        // Enter query
        cy.get('[data-test-subj="documentLevelQuery_query3"]').type('Unknown message');

        // Enter query tags
        cy.get('[data-test-subj="addDocLevelQueryTagButton_query3"]').click({ force: true });
        cy.get('[data-test-subj="documentLevelQueryTag_text_field_query3_tag0"]').type('sev1');

        // Remove existing trigger
        cy.contains('Remove trigger').click({ force: true });

        // Add a trigger
        cy.contains('Add another trigger').click({ force: true });

        // Expand the accordion
        cy.contains('New trigger').click({ force: true });

        // Type in the trigger name
        const newTriggerName = 'new-visual-editor-trigger';
        cy.get('input[name="triggerDefinitions[0].name"]').type(newTriggerName);

        // Define the triggere condition
        cy.get(
          '[data-test-subj="documentLevelTriggerExpression_query_triggerDefinitions[0].triggerConditions.0"]'
        ).type(`${newQueryName}{downarrow}{enter}`);

        // TODO: Test with Notifications plugin

        // Click the create button
        cy.get('button').contains('Update').last().click({ force: true });

        // Confirm we can see only one row in the trigger list by checking <caption> element
        cy.contains('This table contains 1 row');

        // Confirm we can see the new trigger
        cy.contains(newTriggerName);
      });

      it('with only 1 index', () => {
        // This test ensures the bug in this issue has been fixed
        // https://github.com/opensearch-project/alerting-dashboards-plugin/issues/258

        // Creating the test monitor
        cy.createMonitor(sampleDocumentLevelMonitor);
        cy.reload();

        // Confirm the created monitor can be seen
        cy.contains(SAMPLE_DOCUMENT_LEVEL_MONITOR);

        // Select the monitor
        cy.get('a').contains(SAMPLE_DOCUMENT_LEVEL_MONITOR).click({ force: true });

        // Click Edit button
        cy.contains('Edit').click({ force: true });

        // Remove the trigger from the monitor as it's not needed for this test case
        cy.contains('Remove trigger', { timeout: 20000 }).click({ force: true });

        // Click on the Index field and type in multiple index names to replicate the bug
        cy.get('#index')
          .click({ force: true })
          .type(`${TESTING_INDEX_A}{enter}${TESTING_INDEX_B}{enter}`, {
            force: true,
          })
          .trigger('blur', { force: true });

        // Confirm Index field only contains the expected text
        cy.get('[data-test-subj="indicesComboBox"]').should('not.have.text', TESTING_INDEX);
        cy.get('[data-test-subj="indicesComboBox"]').should('not.have.text', TESTING_INDEX_A);
        cy.get('[data-test-subj="indicesComboBox"]').contains(TESTING_INDEX_B, { timeout: 20000 });

        // Click the update button
        cy.get('button').contains('Update').last().click({ force: true });

        // Confirm we're on the Monitor Details page by searching for the History element
        cy.contains('History', { timeout: 20000 });
      });
    });
  });

  after(() => {
    // Delete all monitors and destinations
    cy.deleteAllMonitors();

    // Delete sample data
    cy.deleteIndexByName(TESTING_INDEX);
    cy.deleteIndexByName(TESTING_INDEX_A);
    cy.deleteIndexByName(TESTING_INDEX_B);
  });
});
