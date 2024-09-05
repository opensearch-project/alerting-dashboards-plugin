## Version 2.17.0.0 2024-09-03
Compatible with OpenSearch Dashboards 2.17.0

### Maintenance
* Increment version to 2.17.0.0 ([#1054](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1054))
* [CVE-2024-4068] Pinned package version for braces ([#1024](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1024))
* [CVE-2024-4067] Fix CVE-2024-4067. ([#1074](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1074))

### Refactoring
* support date_nanos type when select time field for creating monitor ([#954](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/954))
* Updated all pages with new header UI ([#1056](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1056))
* Register alerts card with analytics workspace use case ([#1064](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1064))

### Bug fixes
* Fixed cypress tests. ([#1027](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1027))
* [navigation]fix: remove the workspaceAvailability field to make alert visible within workspace ([#1028](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1028))
* Fix failed UT of AddAlertingMonitor.test.js ([#1040](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1040))
* Issue #671 fix trigger name validation ([#794](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/794))
* Fix alerts card in all-use case overview page ([#1073](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1073))

### Documentation
* Added 2.17 release notes. ([#1065](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1065))