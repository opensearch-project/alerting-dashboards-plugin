/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotificationService } from '../services';

export interface BrowserServices {
  notificationService: NotificationService;
}

export interface ActionExecutionResult {
  action_id: string,
  last_execution_time: number,
  throttled_count: number
}

export interface Alert {
  id: string;
  schema_version: number;
  version: number;
  monitor_id: string;
  monitor_version: number;
  monitor_name: string;
  monitor_user: string;
  trigger_id: string;
  trigger_name: string;
  finding_ids: string[];
  related_doc_ids: string[];
  state: string;
  start_time: number;
  last_notification_time: number;
  end_time: number;
  acknowledged_time: number;
  error_message: string;
  alert_history: string[];
  severity: string;
  action_execution_results: ActionExecutionResult[];
}

export interface MDSStates {
  queryParams: MDSQueryParams;
  selectedDataSourceId: string | undefined;
}

export type MDSQueryParams = {
  dataSourceId: string;
};
