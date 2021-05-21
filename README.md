# OpenSearch Alerting Dashboards

The OpenSearch Alerting Dashboards plugin lets you manage your [OpenSearch Alerting plugin](https://github.com/opensearch-project/alerting) to monitor your data and send notifications when certain criteria are met---all from OpenSearch Dashboards.


## Highlights

- Create and schedule *monitors*, which run period queries against data in Opensearch.
- Evaluate query results against *triggers* to see if they meet certain criteria.
- If trigger criteria are met, generate *alerts* and perform *actions* (e.g. post a message in a Slack channel).


## Documentation

Please see our [documentation](https://docs-beta.opensearch.org/).


## Setup

1. Download OpenSearch for the version that matches the [OpenSearch Dashboard version specified in package.json](./package.json#L9).
1. Download and install the appropriate [OpenSearch Alerting plugin](https://github.com/opensearch-project/alerting).
1. Download the OpenSearch-Dashboards source code for the [version specified in package.json](./package.json#L9) you want to set up.

   See the [OpenSearch Dashboards developer guide](https://github.com/opensearch-project/OpenSearch/blob/main/DEVELOPER_GUIDE.md) for more instructions on setting up your development environment.

1. Change your node version to the version specified in `.node-version` inside the OpenSearch-Dashboards root directory.
1. cd into the `plugins` directory of the OpenSearch-Dashboards source code directory.
1. Check out this package from version control into the `plugins` directory.
1. Run `yarn osd bootstrap` inside `Opensearch-Dashboards/plugins/alerting-dashboards-plugin`.

Ultimately, your directory structure should look like this:

```md
.
├── OpenSearch-Dashboards
│   └── plugins
│       └── alerting-dashboards-plugin
```


## Build

To build the plugin's distributable zip simply run `yarn build`.

Example output: `./build/alertingDashboards-1.0.0-rc1.zip`


## Run

- `yarn start`

  - Starts OpenSearch-Dashboards and includes this plugin. OpenSearch-Dashboards will be available on `localhost:5601`.
  - Please run in the OpenSearch-Dashboards root directory
  - You must have OpenSearch running with the Alerting plugin

## Test
  
  There are unit/stubbed integration tests and Cypress e2e/integration tests.
  
- `yarn test:jest`

  - Runs the plugin unit tests.

- `yarn run cypress open`

  - Opens the Cypress test runner.

- `yarn run cypress run`

  - Runs all Cypress tests headlessly in the Electron browser.

 To run the Cypress tests, you must have both OpenSearch and OpenSearch-Dashboards running with the Alerting plugin.
  
 If you are running Cypress tests with OpenSearch-Dashboards development server, pass these 2 options to `yarn start`: 
  1. `--no-base-path`: opt out the BasePathProxy.
  1. `--no-watch`: make sure your server is not restarted.


## Contributing to OpenSearch Alerting OpenSearch-Dashboards

- Refer to [CONTRIBUTING.md](./CONTRIBUTING.md).
- Since this is an OpenSearch-Dashboards plugin, it can be useful to review the [OpenSearch Dashboards contributing guide](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/CONTRIBUTING.md).


## License

This code is licensed under the Apache 2.0 License.

## Copyright

Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.

