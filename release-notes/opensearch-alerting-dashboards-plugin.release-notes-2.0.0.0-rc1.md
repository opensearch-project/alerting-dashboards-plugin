## Version 2.0.0.0-rc1 2022-04-25
Compatible with OpenSearch Dashboards 2.0.0-rc1

### Enhancements 
* Implemented UX support for configuring doc level monitors. ([#218](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/218))
* Integrate Alerting Dashboards with Notifications Plugin ([#220](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/220))
* Added document column to alerts dashboard for doc level monitors. Adjusted alerts dashboard configuration to remove unused alert states for doc level monitors. Refactored style of alerts flyout based on UX feedback. ([#223](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/223)) 

### Maintenance
* Bumped main branch version to 2.0 to align with OpenSearch-Dashboards. Added alpha1 qualifier to align with backend snapshot version. ([#202](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/202))
* [Build] bump plugin version to 2.0.0.0-rc1 ([#213](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/213))
* Incremented version to 2.0-rc1. ([#216](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/216))

### Refactor
* Temporarily disabled destination use in some cypress tests to resolve flakiness. ([#214](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/214))
* Remove disabled buttons and update Destination flows to reflect read-only state ([#221](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/221))

### Bug Fixes
* Fixed a bug that was causing the UX to reset visual editor trigger conditions to their default values when a trigger name contained periods. ([#204](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/204))
* Fixed a bug that was preventing the configured schedule from displaying when editing a monitor that was created through backend commands. ([#197](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/197))
* Fixed bugs associated with alerts table, and addressed UX review feedback. ([#222](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/222))
* Document level monitor UX bug fixes ([#226](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/226))

### Infrastructure
* Removed the Beta label from the bug report template. ([#196](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/196))
* Updated issue templates from .github. ([#205](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/205))

### Documentation
* Add release notes for version 2.0.0-rc1 ([#227](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/227))
