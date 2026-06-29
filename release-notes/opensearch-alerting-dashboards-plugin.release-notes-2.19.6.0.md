## Version 2.19.6 Release Notes

Compatible with OpenSearch and OpenSearch Dashboards version 2.19.6

### Bug Fixes

* Fixed monitor schedule edit workflow when there is no ui_metadata for the monitor ([#1421](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1421))

### Maintenance

* Resolved CVE-2026-2739, CVE-2025-69873, and GHSA-5c6j-r48x-rmvq ([#1469](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1469))
* Resolved CVE-2026-27903, CVE-2026-27904, CVE-2026-33671, CVE-2026-33750, and CVE-2026-33532 by adding yarn resolutions for minimatch, picomatch, brace-expansion, and yaml ([#1440](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1440))
* Resolved CVE-2026-8723 by bumping qs to 6.15.2 ([#1458](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1458))
* Removed direct lodash dependency to address CVE-2025-13465, CVE-2026-2950, and CVE-2026-4800 ([#1475](https://github.com/opensearch-project/alerting-dashboards-plugin/pull/1475))
