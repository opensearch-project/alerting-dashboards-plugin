## Version 2.4.1.0 2022-12-06
Compatible with OpenSearch Dashboards 2.4.1

### Maintenance
* Bumped version to 2.4.1.0 ([#409](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/409))
* Bumped loader-utils version to 1.4.1 ([#361](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/361))
* Adjusted OpenSearch-Dashboards version used by test workflows to 2.4.0 ([#363](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/363))
* Bumped decode-uri-component from 0.2.0 to 0.2.2 ([#384](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/384))
* Bumped decode-uri-component version to address CVE-2022-38900 ([#400](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/400))

### Infrastructure
* Support windows CI ([#354](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/354))
* Add minor punctuation to comment, creating PR to add backport tags ([#376](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/376))
* Adjusted alerting plugin branch used by test workflows ([#390](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/390))

### Documentation
* Add 2.4.1 release notes ([#419](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/419))

### Features
* Align all flyout components to be overlay kind and add close button X in header ([#373](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/373))

### Bug Fixes
* Fix confidence bug ([#360](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/360))
* Validation bug when defining the index for a monitor ([#381](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/381))
* Issues in the UI above 200 destinations ([#386](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/386))
* Fixed a bug that prevented the throttling settings from displaying for PER_ALERT bucket level trigger actions ([#397](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/397))
* Sort data by date for query visualization ([#385](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/385))
* Avoid nesting search inside search when executing trigger condition for preview during create monitor ([#382](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/382))
* Keep monitor table cell width flexible; Check for whether monitor is enabled when displaying related action ([#402](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/402))
