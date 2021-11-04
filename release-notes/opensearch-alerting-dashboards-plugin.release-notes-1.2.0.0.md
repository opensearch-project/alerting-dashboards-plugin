## Version 1.2.0.0 2021-11-04

Compatible with OpenSearch Dashboards 1.2.0

### Maintenance
* Bumps version to 1.2 ([#128](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/128))
* Cherry-pick commits from main branch to 1.x branch ([#131](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/131))

### Bug Fixes
* Fixed a bug that displayed all alerts for a monitor on individual triggers' flyouts. Fixed a bug that displayed incorrect source for the condition field on the alerts flyout. Fixed a bug that displayed incorrect severity on the alerts flyout. Fixed a bug that prevented selecting query-level monitor alerts 1 by 1. Fixed bug relating to validation of popovers when defining monitor queries. ([#123](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/123))
* Fixes flaky test and removes local publishing of plugin dependencies ([#135](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/135))
* Update copyright notice ([#140](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/140))