/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES, FORMIK_INITIAL_VALUES } from './constants';
import { SEARCH_TYPE, INPUTS_DETECTOR_ID, MONITOR_TYPE } from '../../../../../utils/constants';

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
        };
      case MONITOR_TYPE.DOC_LEVEL:
        return docLevelInputToFormik(monitor);
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
    ...monitorInputs(),
    monitor_type,
    ...search,
    searchType,
    fieldName: fieldName ? [{ label: fieldName }] : [],
    timezone: timezone ? [{ label: timezone }] : [],
    detectorId: isAD ? _.get(inputs, INPUTS_DETECTOR_ID) : undefined,
    adResultIndex: isAD ? _.get(inputs, '0.search.indices.0') : undefined,
  };
}

export function docLevelInputToFormik(monitor) {
  const input = monitor.inputs[0]['doc_level_input'];
  const { description, indices, queries } = input;
  return {
    description: description, // TODO DRAFT: DocLevelInput 'description' field isn't currently represented in the mocks. Remove it from frontend?
    index: indicesToFormik(indices),
    query: JSON.stringify(_.omit(input, 'indices'), null, 4),
    queries: queriesToFormik(queries),
  };
}

export function queriesToFormik(queries) {
  return queries.map((query) => {
    let querySource = '';
    try {
      querySource = JSON.parse(query.query);
    } catch (e) {
      querySource = query.query;
    }

    const parsedQuerySource = {};
    const usesIsNotOperator = _.has(querySource, 'bool');
    const operator = usesIsNotOperator ? '!=' : '==';

    if (usesIsNotOperator) {
      const term = _.get(querySource, 'bool.must_not.term');
      const field = _.keys(term)[0];
      parsedQuerySource['field'] = _.trim(field, '":');
      parsedQuerySource['query'] = _.trim(term[field], '"');
    } else {
      const splitQuery = _.split(querySource, '"');
      parsedQuerySource['field'] = _.trim(splitQuery[0], '":');
      parsedQuerySource['query'] = _.trim(splitQuery[1], '"');
    }

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

export function indicesToFormik(indices) {
  return indices.map((index) => ({ label: index }));
}
