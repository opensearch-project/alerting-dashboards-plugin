const { defineConfig } = require('cypress');

module.exports = defineConfig({
  viewportHeight: 900,
  viewportWidth: 1440,
  defaultCommandTimeout: 60000,
  requestTimeout: 300000,
  responseTimeout: 300000,
  env: {
    opensearch_url: 'localhost:9200',
    opensearch_dashboards: 'localhost:5601',
    security_enabled: false,
  },
  fixturesFolder: '.cypress/fixtures',
  screenshotsFolder: '.cypress/screenshots',
  videosFolder: '.cypress/videos',
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      config.env.NODE_OPTIONS = '—max-old-space-size=8192';
      return require('./.cypress/plugins/index.js')(on, config);
    },
    specPattern: '.cypress/e2e/*.cy.js',
    supportFile: '.cypress/support/e2e.js',
    // Performance optimizations
    numTestsKeptInMemory: 0,
    experimentalMemoryManagement: true,
  },
})
