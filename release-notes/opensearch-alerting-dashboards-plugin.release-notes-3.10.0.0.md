## Version 3.10.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.10.0

### Features

* Show data streams in the monitor index picker for local and cross-cluster monitors ([#1518](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1518))
* Display monitor creator from resource sharing in the monitors list ([#1537](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1537))

### Bug Fixes

* Fix monitor search for hyphenated names, PPL monitor card gating for unsupported data sources, Notifications plugin detection probe, and create-form reset on data source change ([#1523](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1523))
* Make look-back window editable when editing a PPL monitor ([#1516](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1516))

### Maintenance

* Bump decode-uri-component and qs to remediate CVE-2026-45822, CVE-2026-82417, and CVE-2026-82562 ([#1539](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1539))
* Update query-string to 9.5.1 to address CVEs in decode-uri-component ([#1532](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1532))
