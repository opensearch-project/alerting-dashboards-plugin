/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import { i18n } from "@osd/i18n";
import { BehaviorSubject } from 'rxjs';
import { DataSourceOption } from "../../../../../src/plugins/data_source_management/public";

export const COMMENTS_ENABLED_SETTING = "plugins.alerting.comments_enabled";
const LocalCluster: DataSourceOption = {
  label: i18n.translate("dataSource.localCluster", {
    defaultMessage: "Local cluster",
  }),
  id: "",
};

// We should use empty object for default value as local cluster may be disabled
export const dataSourceObservable = new BehaviorSubject<DataSourceOption>({});
export const SUMMARY_AGENT_CONFIG_ID = 'os_summary';
export const LOG_PATTERN_SUMMARY_AGENT_CONFIG_ID = 'os_summary_with_log_pattern';