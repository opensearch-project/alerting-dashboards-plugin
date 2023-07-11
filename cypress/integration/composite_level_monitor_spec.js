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
      // cy.intercept('GET', '/api/notifications/get_configs?*', channelResponse);
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
      // cy.get('[name="channel_name_0_0"]').find('input').type('Slack QA').type('{enter}');

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
  });

  after(() => clearAll());
});
