const { defineConfig } = require('cypress')

module.exports = defineConfig({
  defaultCommandTimeout: 10000,
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
      return require('./.cypress/plugins/index.js')(on, config)
    },
    specPattern: '.cypress/integration/*.spec.js',
    supportFile: '.cypress/support/index.js',
  },
})
