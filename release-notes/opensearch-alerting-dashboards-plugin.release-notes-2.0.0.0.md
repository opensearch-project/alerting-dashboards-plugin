## Version 2.0.0.0 2022-05-18
Compatible with OpenSearch Dashboards 2.0.0

### Enhancements
* Implemented UX support for configuring doc level monitors. ([#218](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/218))
* Integrate Alerting Dashboards with Notifications Plugin ([#220](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/220))
* Added document column to alerts dashboard for doc level monitors. Adjusted alerts dashboard configuration to remove unused alert states for doc level monitors. Refactored style of alerts flyout based on UX feedback. ([#223](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/223))
* Refactored alerts table for doc level monitors to display a flyout containing finding information. ([#232](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/232))
* Added documentation ticket workflow. ([#242](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/242))

### Maintenance
* Bumped main branch version to 2.0 to align with OpenSearch-Dashboards. Added alpha1 qualifier to align with backend snapshot version. ([#202](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/202))
* [Build] bump plugin version to 2.0.0.0-rc1 ([#213](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/213))
* Incremented version to 2.0-rc1. ([#216](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/216))
* Updated versions of various dependencies to address CVEs. ([#235](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/235))
* Removed the rc1 qualifier from the plugin version, changed OSD version used by test workflows to 2.0, added test environment. ([#238](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/238))
* Enabled CI for 2.* branches, and removed redundant bug report template. ([#246](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/246))

### Refactor
* Temporarily disabled destination use in some cypress tests to resolve flakiness. ([#214](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/214))
* Remove disabled buttons and update Destination flows to reflect read-only state ([#221](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/221))

### Bug Fixes
* Fixed a bug that was causing the UX to reset visual editor trigger conditions to their default values when a trigger name contained periods. ([#204](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/204))
* Fixed a bug that was preventing the configured schedule from displaying when editing a monitor that was created through backend commands. ([#197](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/197))
* Fixed bugs associated with alerts table, and addressed UX review feedback. ([#222](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/222))
* Document level monitor UX bug fixes ([#226](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/226))
* Fixed issues found during bug bash, and implemented tests. ([#240](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/240))

### Infrastructure
* Removed the Beta label from the bug report template. ([#196](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/196))
* Updated issue templates from .github. ([#205](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/205))

### Documentation
* Add release notes for version 2.0.0-rc1 ([#227](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/227))
* Drafted release notes for 2.0.0. ([#248](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/248))
