const { defineConfig } = require('cypress');

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
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' || browser.name === 'chromium') {
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--js-flags=--max-old-space-size=4096');
        }
        return launchOptions;
      });
      return require('./.cypress/plugins/index.js')(on, config);
    },
    specPattern: '.cypress/integration/*.spec.js',
    supportFile: '.cypress/support/index.js',
    numTestsKeptInMemory: 0,
    experimentalMemoryManagement: true,
  },
});
