## Version 3.6.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.6.0

### Features

* Add lookback window frontend support for PPL/SQL monitors ([#1379](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1379))

### Bug Fixes

* Fix acknowledge alerts modal to properly update table with acknowledged alerts instead of showing a stuck loading state ([#1363](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1363))
* Fix broken anomaly detector monitor definition method in OpenSearch UI ([#1371](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1371))

### Maintenance

* Resolve CVE-2026-26996 and CVE-2026-2739 ([#1393](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1393))
* Update lodash to 4.18.1 to address CVE-2026-4800 ([#1400](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1400))
* Update lodash to 4.18.1 follow-up fix for CVE-2026-4800 ([#1404](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1404))
* Upgrade to React 18 and fix unit tests to accommodate the upgrade ([#1369](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1369))

### Refactoring

* Refactor PPL alerting APIs to use v1 endpoints ([#1378](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1378))
* Remove legacy and PPL alerting separation ([#1392](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1392))
