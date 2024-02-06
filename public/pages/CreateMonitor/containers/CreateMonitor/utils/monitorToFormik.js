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

// Convert Monitor JSON to Formik values used in UI forms
export default function monitorToFormik(monitor) {
  const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
  if (!monitor) return formikValues;
  const {
    name,
    monitor_type,
    enabled,
    schedule: { cron: { expression: cronExpression = formikValues.cronExpression, timezone } = {} },
    inputs,
    ui_metadata: { schedule = {}, search = {} } = {},
    monitorOptions = [],
  } = monitor;
  // Default searchType to query, because if there is no ui_metadata or search then it was created through API or overwritten by API
  // In that case we don't want to guess on the UI what selections a user made, so we will default to just showing the extraction query
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
      case MONITOR_TYPE.COMPOSITE_LEVEL:
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
      default:
        return {
          index: indicesToFormik(inputs[0].search.indices),
          query: JSON.stringify(inputs[0].search.query, null, 4),
        };
    }
  };

  return {
    /* INITIALIZE WITH DEFAULTS */
    ...formikValues,

    /* CONFIGURE MONITOR */
    name,
    disabled: !enabled,

    /* This will overwrite the fields in use by Monitor from ui_metadata */
    ...schedule,
    cronExpression,

    /* DEFINE MONITOR */
    searchType,
    ...monitorInputs(),
    monitor_type,
    ...search,
    fieldName: fieldName ? [{ label: fieldName }] : [],
    timezone: timezone ? [{ label: timezone }] : [],
    detectorId: isAD ? _.get(inputs, INPUTS_DETECTOR_ID) : undefined,
    adResultIndex: isAD ? _.get(inputs, '0.search.indices.0') : undefined,
  };
}

export function indicesToFormik(indices) {
  return indices.map((index) => ({ label: index }));
}

export function docLevelInputToFormik(monitor) {
  const input = monitor.inputs[0][DOC_LEVEL_INPUT_FIELD];
  const { description, indices, queries } = input;
  return {
    description: description,
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
      operator: operator,
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
      field = field = _.trim(parsedQuery[0], '"');
      parsedQuery = _.trim(parsedQuery[1], '"');
      break;
    case OPERATORS_MAP.IS_GREATER_EQUAL.value:
      parsedQuery = _.split(
        query,
        QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_GREATER_EQUAL.value]
      );
      field = field = _.trim(parsedQuery[0], '"');
      parsedQuery = _.trim(parsedQuery[1], '"');
      break;
    case OPERATORS_MAP.IS_LESS.value:
      parsedQuery = _.split(query, QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_LESS.value]);
      field = field = _.trim(parsedQuery[0], '"');
      parsedQuery = _.trim(parsedQuery[1], '"');
      break;
    case OPERATORS_MAP.IS_LESS_EQUAL.value:
      parsedQuery = _.split(query, QUERY_STRING_QUERY_OPERATORS[OPERATORS_MAP.IS_LESS_EQUAL.value]);
      field = field = _.trim(parsedQuery[0], '"');
      parsedQuery = _.trim(parsedQuery[1], '"');
      break;
    default:
      console.log('Unknown query operator detected:', operator);
  }
  return { field: field, query: parsedQuery };
}
