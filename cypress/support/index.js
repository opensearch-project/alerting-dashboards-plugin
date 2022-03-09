/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// ignore the error "ResizeObserver loop limit exceeded", https://github.com/quasarframework/quasar/issues/2233
const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
Cypress.on('uncaught:exception', (err) => {
  /* returning false here prevents Cypress from failing the test */
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false;
  }
});

// Switch the base URL of Opensearch when security enabled in the cluster
// Dashboard endpoint can still be http when security enabled
if (Cypress.env('security_enabled')) {
  Cypress.env('opensearch', `https://${Cypress.env('opensearch_url')}`);
} else {
  Cypress.env('opensearch', `http://${Cypress.env('opensearch_url')}`);
}
