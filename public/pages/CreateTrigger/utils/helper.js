/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { DESTINATION_TYPE } from '../../Destinations/utils/constants';
import { BACKEND_CHANNEL_TYPE, MONITOR_TYPE } from '../../../utils/constants';
import { FORMIK_INITIAL_VALUES } from '../../CreateMonitor/containers/CreateMonitor/utils/constants';
import {
  API_TYPES,
  DEFAULT_CLUSTER_METRICS_SCRIPT,
} from '../../CreateMonitor/components/ClusterMetricsMonitor/utils/clusterMetricsMonitorConstants';
import {
  FORMIK_INITIAL_DOC_LEVEL_SCRIPT,
  FORMIK_INITIAL_TRIGGER_VALUES,
} from '../containers/CreateTrigger/utils/constants';
import moment from 'moment';
import { formikToTrigger } from '../containers/CreateTrigger/utils/formikToTrigger';

export const getChannelOptions = (channels) =>
  channels.map((channel) => ({
    key: channel.type,
    label: channel.type,
    options: channels
      .filter((local_channel) => local_channel.type === channel.type)
      .map((option) => ({ key: option.value, ...option })),
  }));

// Custom Webhooks for Destinations used `custom_webhook` for the type whereas Notification Channels use 'webhook'
// This conversion ensures Notifications' nomenclature is used for the labeling for consistency
export const toChannelType = (type) => {
  if (type === DESTINATION_TYPE.CUSTOM_HOOK) {
    return BACKEND_CHANNEL_TYPE.CUSTOM_WEBHOOK;
  }

  return type;
};

export const getDefaultScript = (monitorValues) => {
  const monitorType = _.get(monitorValues, 'monitor_type', FORMIK_INITIAL_VALUES.monitor_type);
  switch (monitorType) {
    case MONITOR_TYPE.BUCKET_LEVEL:
      return FORMIK_INITIAL_TRIGGER_VALUES.bucketSelector;
    case MONITOR_TYPE.CLUSTER_METRICS:
      const apiType = _.get(monitorValues, 'uri.api_type');
      return _.get(API_TYPES, `${apiType}.defaultCondition`, DEFAULT_CLUSTER_METRICS_SCRIPT);
    case MONITOR_TYPE.DOC_LEVEL:
      return FORMIK_INITIAL_DOC_LEVEL_SCRIPT;
    default:
      return FORMIK_INITIAL_TRIGGER_VALUES.script;
  }
};

export const getTriggerContext = (executeResponse, monitor, values, triggerIndex) => {
  let trigger = formikToTrigger(values, _.get(monitor, 'ui_metadata', {}));
  if (_.isArray(trigger) && triggerIndex >= 0) trigger = trigger[triggerIndex];
  return {
    periodStart: moment.utc(_.get(executeResponse, 'period_start', Date.now())).format(),
    periodEnd: moment.utc(_.get(executeResponse, 'period_end', Date.now())).format(),
    results: [_.get(executeResponse, 'input_results.results[0]')].filter((result) => !!result),
    trigger: trigger,
    alert: null,
    error: null,
    monitor: monitor,
  };
};

export const conditionToExpressions = (condition = '', monitors) => {
  if (!condition.length) return [];

  const conditionMap = {
    '&&': 'AND',
    '||': 'OR',
    '!': 'NOT',
    '': '',
    '&& !': 'AND NOT',
    '|| !': 'OR NOT',
  };
  const queryToExpressionRegex = new RegExp(
    /(!|| && || \|\| || && \!|| \|\| \!)?(monitor\[id=(.*?)\])/,
    'gm'
  );
  const matcher = condition.matchAll(queryToExpressionRegex);
  let match;
  let expressions = [];
  let counter = 0;
  while ((match = matcher.next().value)) {
    if (counter && !match[1]) return []; // Didn't find condition after the first match

    const monitorId = match[3]?.trim(); // match [3] is the monitor_id
    const monitor = monitors.filter((mon) => mon.monitor_id === monitorId);
    expressions.push({
      description: conditionMap[match[1]?.trim()] || '', // match [1] is the description/condition
      isOpen: false,
      monitor_name: monitor[0]?.monitor_name,
      monitor_id: monitorId,
    });

    counter++;
  }

  return expressions;
};
