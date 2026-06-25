/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { FORMIK_INITIAL_VALUES } from './constants';
import { SEARCH_TYPE, MONITOR_TYPE } from '../../../../../utils/constants';

export default function pplAlertingMonitorToFormik(monitorIn) {
  const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
  if (!monitorIn) return formikValues;

  const monitor = monitorIn?.ppl_monitor || monitorIn || {};
  if (!monitor || Object.keys(monitor).length === 0) return formikValues;

  const scheduleObj = monitor.schedule || {};
  const uiMetadata = monitor.ui_metadata || {};

  let cronExpression = formikValues.cronExpression;
  let timezone;
  let scheduleFromMetadata = {};

  if (scheduleObj.cron) {
    cronExpression = scheduleObj.cron.expression || formikValues.cronExpression;
    timezone = scheduleObj.cron.timezone;
    scheduleFromMetadata = uiMetadata.schedule || {};
  } else if (scheduleObj.period) {
    scheduleFromMetadata = {
      frequency: 'interval',
      period: {
        interval: scheduleObj.period.interval || 1,
        unit: (scheduleObj.period.unit || 'MINUTES').toUpperCase(),
      },
    };
  } else {
    scheduleFromMetadata = uiMetadata.schedule || {};
  }

  const pplQuery = monitor.query || _.get(monitorIn, 'inputs[0].ppl_input.query', '');

  const lookbackMeta = uiMetadata?.lookback;
  const lookBackMinutes =
    monitor.look_back_window_minutes ??
    monitor.look_back_window ??
    (lookbackMeta?.enabled ? lookbackMeta.minutes : undefined);
  const timestampField = monitor.timestamp_field || lookbackMeta?.timestamp_field || '';

  let lookBackFormik = {};
  if (lookbackMeta && typeof lookbackMeta.enabled === 'boolean') {
    if (lookbackMeta.enabled && lookbackMeta.minutes > 0) {
      lookBackFormik.useLookBackWindow = true;
      lookBackFormik.lookBackAmount = lookbackMeta.amount || lookbackMeta.minutes;
      lookBackFormik.lookBackUnit = lookbackMeta.unit || 'minutes';
    } else {
      lookBackFormik.useLookBackWindow = false;
    }
  } else if (lookBackMinutes != null && lookBackMinutes > 0) {
    lookBackFormik.useLookBackWindow = true;
    if (lookBackMinutes >= 1440 && lookBackMinutes % 1440 === 0) {
      lookBackFormik.lookBackAmount = lookBackMinutes / 1440;
      lookBackFormik.lookBackUnit = 'days';
    } else if (lookBackMinutes >= 60 && lookBackMinutes % 60 === 0) {
      lookBackFormik.lookBackAmount = lookBackMinutes / 60;
      lookBackFormik.lookBackUnit = 'hours';
    } else {
      lookBackFormik.lookBackAmount = lookBackMinutes;
      lookBackFormik.lookBackUnit = 'minutes';
    }
  } else {
    lookBackFormik.useLookBackWindow = false;
  }

  const result = {
    ...formikValues,
    name: monitor.name,
    description: monitor.description || '',
    disabled: !monitor.enabled,
    ...scheduleFromMetadata,
    cronExpression,
    searchType: SEARCH_TYPE.PPL,
    monitor_type: MONITOR_TYPE.PPL,
    timezone: timezone ? [{ label: timezone }] : [],
    ...(pplQuery ? { pplQuery } : {}),
    timestampField,
    ...lookBackFormik,
    ui_metadata: uiMetadata,
  };

  if (!lookBackFormik.useLookBackWindow) {
    result.lookBackAmount = undefined;
    result.lookBackUnit = undefined;
  }

  return result;
}
