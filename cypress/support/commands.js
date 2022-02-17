/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { API, ADMIN_AUTH } = require('./constants');

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  // Add the basic auth header when security enabled in the Opensearch cluster
  // https://github.com/cypress-io/cypress/issues/1288
  if (Cypress.env('security_enabled')) {
    if (options) {
      options.auth = ADMIN_AUTH;
    } else {
      options = { auth: ADMIN_AUTH };
    }
    // Add query parameters - select the default OpenSearch Dashboards tenant
    options.qs = { security_tenant: 'private' };
    return originalFn(url, options);
  } else {
    return originalFn(url, options);
  }
});

// Be able to add default options to cy.request(), https://github.com/cypress-io/cypress/issues/726
Cypress.Commands.overwrite('request', (originalFn, ...args) => {
  let defaults = {};
  // Add the basic authentication header when security enabled in the Opensearch cluster
  if (Cypress.env('security_enabled')) {
    defaults.auth = ADMIN_AUTH;
  }

  let options = {};
  if (typeof args[0] === 'object' && args[0] !== null) {
    options = Object.assign({}, args[0]);
  } else if (args.length === 1) {
    [options.url] = args;
  } else if (args.length === 2) {
    [options.method, options.url] = args;
  } else if (args.length === 3) {
    [options.method, options.url, options.body] = args;
  }

  return originalFn(Object.assign({}, defaults, options));
});

Cypress.Commands.add('createMonitor', (monitorJSON) => {
  cy.request('POST', `${Cypress.env('opensearch')}${API.MONITOR_BASE}`, monitorJSON);
});

Cypress.Commands.add('createDestination', (destinationJSON) => {
  cy.request('POST', `${Cypress.env('opensearch')}${API.DESTINATION_BASE}`, destinationJSON);
});

Cypress.Commands.add('createAndExecuteMonitor', (monitorJSON) => {
  cy.request('POST', `${Cypress.env('opensearch')}${API.MONITOR_BASE}`, monitorJSON).then(
    (response) => {
      cy.request(
        'POST',
        `${Cypress.env('opensearch')}${API.MONITOR_BASE}/${response.body._id}/_execute`
      );
    }
  );
});

Cypress.Commands.add('deleteMonitorByName', (monitorName) => {
  const body = {
    query: {
      match: {
        'monitor.name': {
          query: monitorName,
          operator: 'and',
        },
      },
    },
  };
  cy.request('GET', `${Cypress.env('opensearch')}${API.MONITOR_BASE}/_search`, body).then(
    (response) => {
      cy.request(
        'DELETE',
        `${Cypress.env('opensearch')}${API.MONITOR_BASE}/${response.body.hits.hits[0]._id}`
      );
    }
  );
});

Cypress.Commands.add('deleteAllMonitors', () => {
  const body = {
    size: 200,
    query: {
      exists: {
        field: 'monitor',
      },
    },
  };
  cy.request({
    method: 'GET',
    url: `${Cypress.env('opensearch')}${API.MONITOR_BASE}/_search`,
    failOnStatusCode: false, // In case there is no alerting config index in cluster, where the status code is 404
    body,
  }).then((response) => {
    if (response.status === 200) {
      for (let i = 0; i < response.body.hits.total.value; i++) {
        cy.request(
          'DELETE',
          `${Cypress.env('opensearch')}${API.MONITOR_BASE}/${response.body.hits.hits[i]._id}`
        );
      }
    } else {
      cy.log('Failed to get all monitors.', response);
    }
  });
});

Cypress.Commands.add('deleteAllDestinations', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('opensearch')}${API.DESTINATION_BASE}?size=200`,
    failOnStatusCode: false, // In case there is no alerting config index in cluster, where the status code is 404
  }).then((response) => {
    if (response.status === 200) {
      for (let i = 0; i < response.body.totalDestinations; i++) {
        cy.request(
          'DELETE',
          `${Cypress.env('opensearch')}${API.DESTINATION_BASE}/${response.body.destinations[i].id}`
        );
      }
    } else {
      cy.log('Failed to get all destinations.', response);
    }
  });
});

Cypress.Commands.add('createIndexByName', (indexName) => {
  cy.request('PUT', `${Cypress.env('opensearch')}/${indexName}`);
});

Cypress.Commands.add('deleteIndexByName', (indexName) => {
  cy.request('DELETE', `${Cypress.env('opensearch')}/${indexName}`);
});

Cypress.Commands.add('insertDocumentToIndex', (indexName, documentId, documentBody) => {
  cy.request('PUT', `${Cypress.env('opensearch')}/${indexName}/_doc/${documentId}`, documentBody);
});

Cypress.Commands.add('loadSampleEcommerceData', () => {
  cy.request({
    method: 'POST',
    headers: { 'osd-xsrf': 'opensearch-dashboards' },
    url: `${Cypress.env('opensearch_dashboards')}/api/sample_data/ecommerce`,
  });
});
