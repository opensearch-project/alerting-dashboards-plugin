/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';
import { resolveOpenSearchDashboardsPath } from '@elastic/plugin-helpers';
import { AlertingPageProvider } from './pageObjects';

// the default export of config files must be a config provider
// that returns an object with the projects config values
export default async function ({ readConfigFile }) {
  // read the OpenSearch Dashboards config file so that we can utilize some of
  // its services and PageObjects
  const openSearchDashboardsConfig = await readConfigFile(
    resolveOpenSearchDashboardsPath('test/functional/config.js')
  );
  return {
    // list paths to the files that contain your plugins tests
    testFiles: [resolve(__dirname, './tests/index.js')],

    // define the name and providers for services that should be
    // available to your tests. If you don't specify anything here
    // only the built-in services will be available
    services: {
      ...openSearchDashboardsConfig.get('services'),
    },
    servers: openSearchDashboardsConfig.get('servers'),
    // just like services, PageObjects are defined as a map of
    // names to Providers. Merge in OpenSearch Dashboards's or pick specific ones
    pageObjects: {
      ...openSearchDashboardsConfig.get('pageObjects'),
      alertingCommon: AlertingPageProvider,
    },

    // the apps section defines the urls that
    // `PageObjects.common.navigateTo(appKey)` will use.
    // Merge urls for your plugin with the urls defined in
    // OpenSearch Dashboards's config in order to use this helper
    apps: {
      ...openSearchDashboardsConfig.get('apps'),
      alerting: {
        pathname: '/app/alerting',
      },
    },

    // choose where esArchiver should load archives from
    // Dump all pre-defined indexes and sample data to test.
    esArchiver: {
      directory: resolve(__dirname, './es_archives'),
    },

    // choose where screenshots should be saved
    screenshots: {
      directory: resolve(__dirname, './tmp/screenshots'),
    },

    // more settings, like timeouts, mochaOpts, etc are
    // defined in the config schema. See {blob}src/functional_test_runner/lib/config/schema.js[src/functional_test_runner/lib/config/schema.js]
  };
}
