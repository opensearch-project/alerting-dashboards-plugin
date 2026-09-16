## Version 3.9.0 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 3.9.0

### Features

* Integrate centralized resource-sharing share button for monitors and workflows ([#1496](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1496))

### Bug Fixes

* Accept v1-shape monitor body in PPL update guard and toV1MonitorBody to prevent query loss on enable/disable toggle ([#1505](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1505))
* Fix empty notification channels and Alerts view for local cluster when Multi-Data-Source is enabled ([#1511](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1511))
* Use sliding lookback window instead of frozen absolute timestamps for PPL monitors and fix query preview on monitor edit ([#1501](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1501))
* Fix test notifications for PPL monitors and prevent silent erasure of PPL query on monitor updates ([#1500](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1500))
* Prevent auto-running monitor preview query before index and time field are set on create monitor page ([#1499](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1499))

### Infrastructure

* Fix CI: migrate binary-installation workflow to official opensearch-build actions ([#1507](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1507))
* Fix code-coverage action ([#1509](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1509))
* Onboard code diff analyzer/reviewer and issue dedupe workflows ([#1480](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1480))

### Maintenance

* Clean up resolutions and dependencies, align with OpenSearch Dashboards 3.8, and address CVEs ([#1494](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1494))
