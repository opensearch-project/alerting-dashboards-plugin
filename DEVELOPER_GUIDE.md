- [Developer guide](#developer-guide)
  - [Forking and Cloning](#forking-and-cloning)
  - [Install Prerequisites](#install-prerequisites)
  - [Environment Setup](#environment-setup)
  - [Build](#build)
  - [Run](#run)
  - [Test](#test)

## Developer guide

So you want to contribute code to this project? Excellent! We're glad you're here. Here's what you need to do.

### Forking and Cloning

Fork this repository on GitHub, and clone locally with `git clone`.

### Install Prerequisites

You will need to install [node.js](https://nodejs.org/en/), [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md), and [yarn](https://yarnpkg.com/) in your environment to properly pull down dependencies to build and bootstrap the plugin.

### Environment Setup

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
  1. `--no-watch`: make sure your server has not restarted.