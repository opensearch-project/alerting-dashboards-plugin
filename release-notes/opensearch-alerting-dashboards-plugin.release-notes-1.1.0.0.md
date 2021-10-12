## Version 1.1.0.0 2021-09-07

Compatible with OpenSearch Dashboards 1.1.0

### Features

* Bucket level alerting create monitor page refactor ([#62](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/62))
* Add DefineBucketLevelTrigger component ([#63](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/63))
* Refactor CreateTrigger components to support single-page experience ([#64](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/64))
* Update CreateMonitor to incorporate new single-page experience ([#65](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/65))
* Update Monitor overview page ([#66](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/66))
* Alert dashboard table column update ([#67](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/67))
* Refactored query and bucket-level trigger definitions to align with new mocks ([#68](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/68))
* Alert dashboard update on monitor ([#72](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/72))
* Create monitor page, bucket level monitor showing bar graph  ([#73](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/73))
* Use destination api to validate destination name ([#69](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/69))
* Update Monitor Details panel ([#75](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/75))
* Flyout panel on alert dashboard page ([#78](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/78))
* Add button to refresh graph , add accordion to expand/collapse graph view ([#79](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/79))
* Add success toast message for create and update monitor ([#80](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/80))
* Refactored trigger condition popover to dropdown menu. Refactored actions panel to hide throttling for 'per execution' ([#81](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/81))
* Added Export JSON button and modal to create/edit Monitor page ([#82](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/82))
* Added Monitor state EuiHealth element, replaced state item in overview with Monitor level type ([#83](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/83))
* Update alert history graph for bucket-level monitors ([#84](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/84))
* Refactored query trigger definition components to align with mocks. ([#85](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/85))
* Removed the close button from the top-right of the alert dashboard flyout. Refactored monitor details page for anomaly detection monitors. ([#86](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/86))
* Several changes in query panel ([#87](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/87))
* Implemented test message toast. Fixed alerts dashboard severity display bug. ([#88](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/88))
* Refactored Dashboard::getMonitors to function without using the from and size parameters from getAlerts ([#89](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/89))
* Query level monitor updates ([#90](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/90))
* Changes of metrics expression and graph  ([#95](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/95))
* Update formik conversion for Bucket-Level Trigger to handle throttle change ([#97](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/97))
* Implemented View alert details, and logic for landing page alerts dashboard. ([#98](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/98))
* Added limit text, adjusted spacing/sizing/text, etc. ([#100](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/100))
* Remove pagination and set default size of alerts pert trigger to 10000 ([#99](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/99))

### Enhancements

* Show Error Toast Message whenever action execution fails from backend due to incorrect configurations ([#22](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/22))
* Bucket level alerting dev UX review feedback ([#93](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/93))
* Text updates ([#105](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/105))

### Maintenance

* Commit the updated yarn lock to maintain consistency.  ([#26](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/26))
*  Add Integtest.sh for OpenSearch integtest setups ([#28](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/28))
* Allow for custom endpoints for cypress tests ([#29](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/29))
* Add Cypress tests for Bucket-Level Alerting ([#91](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/91))
* Update cypress-workflow.yml to use environment variable for OS and OS dashboard versions ([#96](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/96))
* Create opensearch-alerting-dashboards-plugin.release-notes-1.1.0.0.md ([#101](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/101))
* Update version in package.json ([#102](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/102)) 
* Update jest unit tests ([#112](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/112))

### Bug Fixes
* Fixed a bug that displayed all alerts for a monitor on individual triggers' flyouts. Fixed a bug that displayed incorrect source for the condition field on the alerts flyout. Fixed a bug that displayed incorrect severity on the alerts flyout. Fixed a bug that prevented selecting query-level monitor alerts 1 by 1. Consolidates bug fixes from PR 121 and 122 ([#123](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/123))