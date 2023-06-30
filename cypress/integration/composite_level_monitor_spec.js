/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { API, PLUGIN_NAME } from '../support/constants';
import sampleCompositeJson from '../fixtures/sample_composite_level_monitor.json';
import * as _ from 'lodash';

const sample_index_1 = 'sample_index_1';
const sample_index_2 = 'sample_index_2';
const SAMPLE_VISUAL_EDITOR_MONITOR = 'sample_visual_editor_composite_level_monitor';

const errorPopupTitle = 'Failed to create the monitor';
const errorPopupMessage = 'Fix all highlighted error(s) before continuing.';

const channelResponse = {
  start_index: 0,
  total_hits: 2,
  total_hit_relation: 'eq',
  config_list: [
    {
      config_id: 'IfAMAokBSW0JqZ7J8Xak',
      last_updated_time_ms: 1687956550050,
      created_time_ms: 1687956550050,
      config: {
        name: 'Slack QA',
        description: '',
        config_type: 'slack',
        is_enabled: true,
        slack: {
          url: 'https://hooks.slack.com/services/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',
        },
      },
    },
    {
      config_id: '1wjNBokBgeCTAwoGHvqH',
      last_updated_time_ms: 1688036253318,
      created_time_ms: 1688036253318,
      config: {
        name: 'Slack Test',
        description: 'Channel description',
        config_type: 'slack',
        is_enabled: true,
        slack: {
          url: 'https://hooks.slack.com/services/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',
        },
      },
    },
  ],
};

const clearAll = () => {
  cy.deleteIndexByName(sample_index_1);
  cy.deleteIndexByName(sample_index_2);

  cy.deleteAllAlerts();
  cy.deleteAllMonitors();
};

describe('CompositeLevelMonitor', () => {
  before(() => {
    clearAll();

    // Create indices
    cy.createIndexByName(sample_index_1, sampleCompositeJson.sample_composite_index);
    cy.createIndexByName(sample_index_2, sampleCompositeJson.sample_composite_index);

    // Create associated monitors
    cy.createMonitor(sampleCompositeJson.sample_composite_associated_monitor_1);
    cy.createMonitor(sampleCompositeJson.sample_composite_associated_monitor_2);
    cy.createMonitor(sampleCompositeJson.sample_composite_associated_monitor_3);
  });

  beforeEach(() => {
    // Set welcome screen tracking to false
    localStorage.setItem('home:welcome:show', 'false');
  });

  const validateErrorPopup = () => {
    cy.get('.euiToast').contains(errorPopupTitle);
    cy.get('.euiToast').contains(errorPopupMessage);
  };
  describe('can be validated', () => {
    beforeEach(() => {
      // Visit Alerting OpenSearch Dashboards
      cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors`);

      // Common text to wait for to confirm page loaded, give up to 20 seconds for initial load
      cy.contains('Create monitor', { timeout: 20000 });

      // Go to create monitor page
      cy.contains('Create monitor').click({ force: true });

      // Select the Composite-Level Monitor type
      cy.get('[data-test-subj="compositeLevelMonitorRadioCard"]').click({ force: true });
    });

    it('by visual editor', () => {
      // Select visual editor for method of definition

      cy.intercept('GET', '/api/notifications/get_configs?*', channelResponse);
      cy.get('[data-test-subj="visualEditorRadioCard"]').click({ force: true });

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').focus().blur();
      cy.get('input[name="name"]')
        .parents('.euiFormRow')
        .find('.euiFormErrorText')
        .contains('Required.');

      cy.get('button').contains('Create').click({ force: true });
      validateErrorPopup();

      cy.get('input[name="name"]').type(SAMPLE_VISUAL_EDITOR_MONITOR);
      cy.get('input[name="name"]')
        .parents('.euiFormRow')
        .find('.euiFormErrorText')
        .should('not.exist');

      cy.get('[data-test-subj="monitors_list_0"]').find('input').focus().blur();
      cy.get('[data-test-subj="monitors_list_0"]')
        .parents('.euiFormRow')
        .find('.euiFormErrorText')
        .contains('Required.');

      cy.get('button').contains('Create').click({ force: true });
      validateErrorPopup();

      cy.get('[data-test-subj="monitors_list_0"]')
        .type('monitorOne', { delay: 50 })
        .type('{enter}');
      cy.get('[data-test-subj="monitors_list_1"]')
        .type('monitorTwo', { delay: 50 })
        .type('{enter}');

      cy.get('[data-test-subj="monitors_list_0"]')
        .parents('.euiFormRow')
        .find('.euiFormErrorText')
        .should('not.exist');

      cy.get('button').contains('Add trigger').click({ force: true });

      cy.get('[data-test-subj="triggerDefinitions[0]._triggerAccordion"]')
        .parents('.euiAccordion')
        .within(() => {
          cy.get('[data-test-subj="composite-trigger-name"]')
            .type('{selectall}')
            .type('{backspace}')
            .type('Composite trigger');

          cy.get('[name="channel_name_0_0"]').find('input').type('Slack QA').type('{enter}');
        });

      cy.wait(1000);

      cy.get('button').contains('Add trigger').click({ force: true });

      cy.get('[data-test-subj="triggerDefinitions[1]._triggerAccordion"]')
        .parents('button')
        .click({ force: true });

      cy.get('button').contains('Associate another monitor').click();
      cy.get('[data-test-subj="monitors_list_2"]')
        .type('monitorThree', { delay: 50 })
        .type('{enter}');

      cy.get('[data-test-subj="condition-add-options-btn_1"]').click();
      cy.get('[data-test-subj="select-expression_1_0"]')
        .click({ force: true })
        .then(() => {
          cy.wait(1000);
          cy.get('[data-test-subj="monitors-combobox-1-0"]', { timeout: 3000 })
            .type('monitorThree')
            .type('{enter}');
        });

      cy.get('[data-test-subj="select-expression_0_2"]').click({ force: true });
      cy.get('[data-test-subj="triggerDefinitions[0].triggerConditions"]').contains('monitorThree');
      cy.get('[data-test-subj="selection-exp-field-item-remove-0-2"]').click({ force: true });
      cy.get('[data-test-subj="triggerDefinitions[0].triggerConditions"]').should(
        'not.contain',
        'monitorThree'
      );

      cy.get('[data-test-subj="select-expression_1_1"]')
        .click({ force: true })
        .then(() => {
          cy.wait(1000);
          cy.get('[data-test-subj="monitors-combobox-1-1"]', { timeout: 3000 })
            .type('monitorOne')
            .type('{enter}');
        });

      cy.get('[data-test-subj="triggerDefinitions[1]._triggerAccordion"]')
        .parents('.euiAccordion')
        .within(() => {
          cy.get('[data-test-subj="composite-trigger-name"]')
            .type('{selectall}')
            .type('{backspace}')
            .type('Test trigger');

          cy.get('[name="channel_name_1_0"]').find('input').type('Slack Test').type('{enter}');
        });

      cy.wait(1000);
      cy.get('[data-test-subj="triggerDefinitions[0]._triggerAccordion"]')
        .parents('.euiAccordion')
        .find('button')
        .contains('Remove trigger')
        .click({ force: true });

      cy.wait(1000);
      cy.get('[data-test-subj="triggerDefinitions[0]._triggerAccordion"]')
        .parents('.euiAccordion')
        .within(() => {
          cy.get('[data-test-subj="composite-trigger-name"]').should('have.value', 'Test trigger');
          cy.get('[name="channel_name_0_0"]').contains('Slack Test');
          cy.get('[data-test-subj="triggerDefinitions[0].triggerConditions"]').contains(
            'monitorThree'
          );
          cy.get('[data-test-subj="triggerDefinitions[0].triggerConditions"]').contains(
            'monitorOne'
          );
        });
    });
  });

  describe('can be created', () => {
    beforeEach(() => {
      // Visit Alerting OpenSearch Dashboards
      cy.visit(`${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors`);

      // Common text to wait for to confirm page loaded, give up to 20 seconds for initial load
      cy.contains('Create monitor', { timeout: 20000 });

      // Go to create monitor page
      cy.contains('Create monitor').click({ force: true });

      // Select the Composite-Level Monitor type
      cy.get('[data-test-subj="compositeLevelMonitorRadioCard"]').click({ force: true });
    });

    it('by visual editor', () => {
      // Select visual editor for method of definition
      cy.intercept('GET', '/api/notifications/get_configs?*', channelResponse);
      cy.get('[data-test-subj="visualEditorRadioCard"]').click({ force: true });

      // Wait for input to load and then type in the monitor name
      cy.get('input[name="name"]').type(SAMPLE_VISUAL_EDITOR_MONITOR);

      // Select associated monitors
      cy.get('[data-test-subj="monitors_list_0"]')
        .type('monitorOne', { delay: 50 })
        .type('{enter}');
      cy.get('[data-test-subj="monitors_list_1"]')
        .type('monitorTwo', { delay: 50 })
        .type('{enter}');

      cy.get('button').contains('Add trigger').click({ force: true });

      // Type trigger name
      cy.get('[data-test-subj="composite-trigger-name"]')
        .type('{selectall}')
        .type('{backspace}')
        .type('Composite trigger');

      // TODO: Test with Notifications plugin
      // Select notification channel
      cy.get('[name="channel_name_0_0"]').find('input').type('Slack QA').type('{enter}');

      cy.intercept('api/alerting/workflows').as('createMonitorRequest');
      cy.intercept(`api/alerting/monitors?*`).as('getMonitorsRequest');
      cy.get('button').contains('Create').click({ force: true });

      // Wait for monitor to be created
      cy.wait('@createMonitorRequest').then((interceptor) => {
        const monitorId = interceptor.response.body.resp._id;

        cy.contains('Loading monitors');
        cy.wait('@getMonitorsRequest').then((interceptor) => {
          const monitors = interceptor.response.body.monitors;
          const monitor1 = monitors.filter((monitor) => monitor.name === 'monitor_1');
          const monitor2 = monitors.filter((monitor) => monitor.name === 'monitor_2');

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
              cy.executeCompositeMonitor(monitorId);
              monitor1[0] && cy.executeMonitor(monitor1[0].id);
              monitor2[0] && cy.executeMonitor(monitor2[0].id);

              cy.get('[role="tab"]').contains('Alerts').click({ force: true });
              cy.get('table tbody td').contains('Composite trigger');
            });
          });
        });
      });
    });
  });

  describe('can be edited', () => {
    beforeEach(() => {
      const body = {
        size: 200,
        query: {
          match_all: {},
        },
      };
      cy.request({
        method: 'GET',
        url: `${Cypress.env('opensearch')}${API.MONITOR_BASE}/_search`,
        failOnStatusCode: false, // In case there is no alerting config index in cluster, where the status code is 404
        body,
      }).then((response) => {
        if (response.status === 200) {
          const monitors = response.body.hits.hits;
          const createdMonitor = _.find(
            monitors,
            (monitor) => monitor._source.name === SAMPLE_VISUAL_EDITOR_MONITOR
          );
          if (createdMonitor) {
            cy.visit(
              `${Cypress.env('opensearch_dashboards')}/app/${PLUGIN_NAME}#/monitors/${
                createdMonitor._id
              }?action=update-monitor&type=workflow`
            );
          } else {
            cy.log('Failed to get created monitor ', SAMPLE_VISUAL_EDITOR_MONITOR);
            throw new Error(`Failed to get created monitor ${SAMPLE_VISUAL_EDITOR_MONITOR}`);
          }
        } else {
          cy.log('Failed to get all monitors.', response);
        }
      });
    });

    it('by visual editor', () => {
      // Verify edit page
      cy.contains('Edit monitor', { timeout: 20000 });
      cy.get('input[name="name"]').type('_edited');

      cy.get('label').contains('Visual editor').click({ force: true });

      cy.get('button').contains('Associate another monitor').click({ force: true });

      cy.get('[data-test-subj="monitors_list_2"]')
        .type('monitorThree', { delay: 50 })
        .type('{enter}');

      cy.get('button').contains('Composite trigger').click({ force: true });

      cy.get('[data-test-subj="condition-add-options-btn_0"]').click({ force: true });
      cy.get('[data-test-subj="select-expression_0_2"]').click({ force: true });
      cy.wait(1000);
      cy.get('[data-test-subj="monitors-combobox-0-2"]')
        .type('monitorThree', { delay: 50 })
        .type('{enter}');

      cy.get('[name="channel_name_0_0"]').contains('Slack QA');

      cy.intercept('api/alerting/workflows/*').as('updateMonitorRequest');
      cy.get('button').contains('Update').click({ force: true });

      // Wait for monitor to be created
      cy.wait('@updateMonitorRequest').then(() => {
        cy.get('.euiTitle--large').contains(`${SAMPLE_VISUAL_EDITOR_MONITOR}_edited`);
      });
    });
  });

  after(() => clearAll());
});
