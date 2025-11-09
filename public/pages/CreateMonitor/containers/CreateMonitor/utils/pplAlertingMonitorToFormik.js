/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES, FORMIK_INITIAL_VALUES } from './constants';
import { SEARCH_TYPE, INPUTS_DETECTOR_ID, MONITOR_TYPE } from '../../../../../utils/constants';
import { OPERATORS_MAP } from '../../../components/MonitorExpressions/expressions/utils/constants';
import {
  DOC_LEVEL_INPUT_FIELD,
  QUERY_STRING_QUERY_OPERATORS,
} from '../../../components/DocumentLevelMonitorQueries/utils/constants';
import { conditionToExpressions } from '../../../../CreateTrigger/utils/helper';

// Convert Monitor JSON to Formik values used in UI forms (PPL-aware)
export default function pplAlertingMonitorToFormik(monitorIn) {
  const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
  if (!monitorIn) return formikValues;

  const monitor =
    monitorIn?.monitor_v2?.ppl_monitor ||
    monitorIn?.monitorV2?.ppl_monitor ||
    monitorIn?.ppl_monitor ||
    monitorIn ||
    {};
  if (!monitor || Object.keys(monitor).length === 0) return formikValues;

  let cronExpression = formikValues.cronExpression;
  let timezone;
  let scheduleFromMetadata = {};

  const scheduleObj = monitor.schedule || {};
  const uiMetadata = monitor.ui_metadata || {};

  if (scheduleObj.cron) {
    cronExpression = scheduleObj.cron.expression || formikValues.cronExpression;
    timezone = scheduleObj.cron.timezone;
    scheduleFromMetadata = uiMetadata.schedule || {};
  } else if (scheduleObj.period) {
    const interval = scheduleObj.period.interval || 1;
    const unit = (scheduleObj.period.unit || 'MINUTES').toUpperCase();

    scheduleFromMetadata = {
      frequency: 'interval',
      period: {
        interval,
        unit,
      },
    };
  } else {
    scheduleFromMetadata = uiMetadata.schedule || {};
  }

  const {
    name,
    monitor_type,
    enabled,
    inputs = [],
    ui_metadata: { search = {} } = {},
    monitorOptions = [],
  } = monitor;
  const { searchType = 'query', fieldName } = search;
  const isAD = searchType === SEARCH_TYPE.AD;

  const monitorInputs = () => {
    switch (monitor_type) {
      case MONITOR_TYPE.CLUSTER_METRICS:
        return {
          index: FORMIK_INITIAL_VALUES.index,
          uri: inputs[0].uri,
          clusterNames: inputs[0].uri.clusters || [],
          searchType: SEARCH_TYPE.CLUSTER_METRICS,
        };
      case MONITOR_TYPE.DOC_LEVEL:
        return docLevelInputToFormik(monitor);
      case MONITOR_TYPE.COMPOSITE_LEVEL: {
        const triggerConditions = _.get(
          monitor,
          'triggers[0].chained_alert_trigger.condition.script.source',
          ''
        );

        const parsedConditions = conditionToExpressions(triggerConditions, monitorOptions);
        const preventVisualEditor =
          !!triggerConditions.length && triggerConditions !== '()' && !parsedConditions.length;

        return {
          associatedMonitors: _.get(monitor, 'inputs[0].composite_input', {}),
          searchType: preventVisualEditor ? 'query' : 'graph',
        };
      }
      default: {
        const idx = inputs?.[0]?.search?.indices || [];
        const q = inputs?.[0]?.search?.query ?? {};
        return {
          index: indicesToFormik(idx),
          query: JSON.stringify(q, null, 4),
        };
      }
    }
  };

  const pplQuery = monitor.query || '';
  const timestampField = monitor.timestamp_field || '@timestamp';
  const description = monitor.description || '';

  let lookBackFormik = {};
  const lookBackMinutes = monitor.look_back_window_minutes ?? monitor.look_back_window;
  if (lookBackMinutes != null) {
    const minutes = lookBackMinutes;
    lookBackFormik.useLookBackWindow = true;

    if (minutes >= 1440 && minutes % 1440 === 0) {
      lookBackFormik.lookBackAmount = minutes / 1440;
      lookBackFormik.lookBackUnit = 'days';
    } else if (minutes >= 60 && minutes % 60 === 0) {
      lookBackFormik.lookBackAmount = minutes / 60;
      lookBackFormik.lookBackUnit = 'hours';
    } else {
      lookBackFormik.lookBackAmount = minutes;
      lookBackFormik.lookBackUnit = 'minutes';
    }
  } else {
    // Explicitly set useLookBackWindow to false when look_back_window_minutes is null or undefined
    // Don't include lookBackAmount and lookBackUnit to prevent old values from persisting
    lookBackFormik.useLookBackWindow = false;
  }

  const result = {
    ...formikValues,
    name,
    description,
    disabled: !enabled,
    ...scheduleFromMetadata,
    cronExpression,
    searchType,
    ...monitorInputs(),
    monitor_type,
    ...search,
    fieldName: fieldName ? [{ label: fieldName }] : [],
    timezone: timezone ? [{ label: timezone }] : [],
    detectorId: isAD ? _.get(inputs, INPUTS_DETECTOR_ID) : undefined,
    adResultIndex: isAD ? _.get(inputs, '0.search.indices.0') : undefined,
    ...(pplQuery ? { pplQuery } : {}),
    ...(monitor.timestamp_field ? { timestampField } : {}),
    ...lookBackFormik,
  };

  // When useLookBackWindow is false, explicitly clear lookBackAmount and lookBackUnit
  // to prevent default values from FORMIK_INITIAL_VALUES from persisting
  if (!lookBackFormik.useLookBackWindow) {
    result.lookBackAmount = undefined;
    result.lookBackUnit = undefined;
  }

  return result;
}

export function indicesToFormik(indices) {
  return indices.map((index) => ({ label: index }));
}

export function docLevelInputToFormik(monitor) {
  const input = monitor.inputs[0][DOC_LEVEL_INPUT_FIELD];
  const { description, indices, queries } = input;
  return {
    description,
    index: indicesToFormik(indices),
    query: JSON.stringify(_.omit(input, 'indices'), null, 4),
    queries: queriesToFormik(queries),
  };
}

export function queriesToFormik(queries) {
  return queries.map((query) => {
    let querySource;
    try {
      querySource = JSON.parse(query.query);
    } catch (e) {
      querySource = query.query;
    }

    const operator = getQueryOperator(querySource);
    const parsedQuerySource = parseQueryString(querySource, operator);

    return {
      ...FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES,
      id: query.id,
      queryName: query.name,
      tags: query.tags,
      operator,
      ...parsedQuerySource,
    };
  });
}

export function getQueryOperator(query = FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES.query) {
  if (_.startsWith(query, 'NOT (') && _.endsWith(query, ')')) return OPERATORS_MAP.IS_NOT.value;
  if (_.includes(query, QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_GREATER_EQUAL.value]))
    return OPERATORS_MAP.IS_GREATER_EQUAL.value;
  if (_.includes(query, QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_GREATER.value]))
    return OPERATORS_MAP.IS_GREATER.value;
  if (_.includes(query, QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_LESS_EQUAL.value]))
    return OPERATORS_MAP.IS_LESS_EQUAL.value;
  if (_.includes(query, QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_LESS.value]))
    return OPERATORS_MAP.IS_LESS.value;
  return OPERATORS_MAP.IS.value;
}

export function parseQueryString(
  query = FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES.query,
  operator = OPERATORS_MAP.IS.value
) {
  let field = FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES.field;
  let parsedQuery = FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES.query;
  switch (operator) {
    case OPERATORS_MAP.IS.value:
      parsedQuery = _.split(query, '"');
      field = _.trim(parsedQuery[0], '":');
      parsedQuery = _.trim(parsedQuery[1], '"');
      break;
    case OPERATORS_MAP.IS_NOT.value:
      parsedQuery = query.substring(5, query.length - 1);
      parsedQuery = _.split(parsedQuery, ':');
      field = _.trim(parsedQuery[0], '"');
      parsedQuery = _.trim(parsedQuery[1], '"');
      break;
    case OPERATORS_MAP.IS_GREATER.value:
      parsedQuery = _.split(query, QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_GREATER.value]);
      field = _.trim(parsedQuery[0], '"');
      parsedQuery = _.trim(parsedQuery[1], '"');
      break;
    case OPERATORS_MAP.IS_GREATER_EQUAL.value:
      parsedQuery = _.split(
        query,
        QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_GREATER_EQUAL.value]
      );
      field = _.trim(parsedQuery[0], '"');
      parsedQuery = _.trim(parsedQuery[1], '"');
      break;
    case OPERATORS_MAP.IS_LESS.value:
      parsedQuery = _.split(query, QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_LESS.value]);
      field = _.trim(parsedQuery[0], '"');
      parsedQuery = _.trim(parsedQuery[1], '"');
      break;
    case OPERATORS_MAP.IS_LESS_EQUAL.value:
      parsedQuery = _.split(query, QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_LESS_EQUAL.value]);
      field = _.trim(parsedQuery[0], '"');
      parsedQuery = _.trim(parsedQuery[1], '"');
      break;
    default:
      // eslint-disable-next-line no-console
      console.log('Unknown query operator detected:', operator);
  }
  return { field, query: parsedQuery };
}
