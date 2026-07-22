## Version 3.8.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.8.0

### Features

* Add dynamic capability-based coordination for Explore "Create monitor" menu entry ([#1461](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1461))
* Extract shared PPL monitor components and helpers, and fix miscellaneous PPL monitor bugs ([#1470](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1470))

### Enhancements

* Onboard new backport-pr reusable GitHub workflow ([#1478](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1478))

### Infrastructure

* Pin GitHub Actions to commit SHAs for supply chain security ([#1456](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1456))
* Adopt ESLint 10 flat config and remove legacy `.eslintrc` ([#1486](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1486))
* Migrate Jest test suite to Jest 30 and jsdom 26 ([#1490](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1490))
* Remove direct `@babel/plugin-transform-modules-commonjs` dependency and use transitive dependency from OSD ([#1491](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1491))

### Maintenance

* Resolve CVE-2026-2739, CVE-2025-69873, and GHSA-5c6j-r48x-rmvq by adding resolutions for bn.js and serialize-javascript ([#1476](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1476))

### Refactoring

* Drop unused `observabilityDashboards` optional plugin dependency and fix indentation ([#1464](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1464))
