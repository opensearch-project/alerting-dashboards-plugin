## Version 2.0.1.0 2022-06-10
Compatible with OpenSearch Dashboards 2.0.1

### Bug Fixes
* Implemented a fix for issue 258 which was allowing the UX to define more than 1 index for document level monitors. ([#259](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/259))
* Fixed a bug that was causing the action execution policy to be configurable for query and cluster metrics monitors. ([#261](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/261))
* Fixed an issue preventing doc level monitors from adding execution policy as expected. ([#262](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/262))
* Fixed an issue that would sometimes cause the loadDestinations function to not call getChannels. ([#264](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/264))

### Maintenance
* Incremented version to 2.0.1 ([#269](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/269))

### Documentation
* Draft release notes for 2.0.1 patch. ([#265](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/265))