/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import {
  formikToMonitor,
  formikToUiSearch,
  formikToIndices,
  formikToQuery,
  formikToExtractionQuery,
  formikToGraphQuery,
  formikToUiGraphQuery,
  formikToUiOverAggregation,
  formikToMetricAggregation,
  formikToUiSchedule,
  buildSchedule,
  formikToWhereClause,
  formikToAd,
  formikToInputs,
  formikToClusterMetricsInput,
  formikToRoles,
} from './formikToMonitor';

import { FORMIK_INITIAL_VALUES } from './constants';
import { OPERATORS_MAP } from '../../../components/MonitorExpressions/expressions/utils/constants';

jest.mock('moment-timezone', () => {
  const moment = jest.requireActual('moment-timezone');
  moment.tz.guess = () => 'America/Los_Angeles';
  return moment;
});

describe('formikToMonitor', () => {
  let formikValues;
  beforeEach(() => {
    formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
    formikValues.name = 'random_name';
    formikValues.disabled = true;
    formikValues.index = [{ label: 'index1' }, { label: 'index2' }];
    formikValues.fieldName = [{ label: 'bytes' }];
    formikValues.timezone = [{ label: 'America/Los_Angeles' }];
    formikValues.roles = [];
  });
  test('can build monitor', () => {
    expect(formikToMonitor(formikValues)).toMatchSnapshot();
  });
  test('can build monitor with roles', () => {
    formikValues.roles = [{ label: 'test_bk_role_1' }, { label: 'test_bk_role_2' }];
    expect(formikToMonitor(formikValues)).toMatchSnapshot();
  });
});

describe('formikToInputs', () => {
  const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
  test('can call formikToClusterMetricsUri', () => {
    formikValues.searchType = 'clusterMetrics';
    expect(formikToInputs(formikValues)).toMatchSnapshot();
  });
});

describe('formikToDetector', () => {
  const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
  formikValues.detectorId = 'temp_detector';
  test('can build detector', () => {
    expect(formikToAd(formikValues)).toMatchSnapshot();
  });
});

describe('formikToClusterMetricsUri', () => {
  test('can build a ClusterMetricsMonitor request with path params', () => {
    const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
    formikValues.uri.path = '_cluster/health';
    formikValues.uri.path = 'params';
    expect(formikToClusterMetricsInput(formikValues)).toMatchSnapshot();
  });
  test('can build a ClusterMetricsMonitor request without path params', () => {
    const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
    formikValues.uri.path = '_cluster/health';
    expect(formikToClusterMetricsInput(formikValues)).toMatchSnapshot();
  });
});

describe('formikToUiSearch', () => {
  const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
  formikValues.fieldName = [{ label: 'bytes' }];
  formikValues.timeField = '@timestamp';
  test('can build ui search', () => {
    expect(formikToUiSearch(formikValues)).toMatchSnapshot();
  });
  test('can build ui search with term where field', () => {
    formikValues.where = {
      fieldName: [{ label: 'age', type: 'number' }],
      operator: OPERATORS_MAP.IS_GREATER_EQUAL.value,
      fieldValue: 20,
    };
    expect(formikToUiSearch(formikValues)).toMatchSnapshot();
  });

  test('can build ui search with range where field', () => {
    formikValues.where = {
      fieldName: [{ label: 'age', type: 'number' }],
      operator: OPERATORS_MAP.IN_RANGE.value,
      fieldRangeStart: 20,
      fieldRangeEnd: 40,
    };
    expect(formikToUiSearch(formikValues)).toMatchSnapshot();
  });
});

describe('formikToIndices', () => {
  test('can build index', () => {
    const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
    formikValues.index = [{ label: 'index1' }, { label: 'index2' }];
    expect(formikToIndices(formikValues)).toMatchSnapshot();
  });
});

describe('formikToRoles', () => {
  test('can build roles', () => {
    const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
    formikValues.roles = [{ label: 'test_bk_role_1' }, { label: 'test_bk_role_2' }];
    expect(formikToRoles(formikValues)).toMatchSnapshot();
  });
});

describe('formikToQuery', () => {
  const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);

  test('can build graph query', () => {
    expect(formikToQuery({ ...formikValues, timeField: '@timestamp' })).toMatchSnapshot();
  });

  test('can build extraction query', () => {
    formikValues.searchType = 'query';
    expect(formikToQuery(formikValues)).toMatchSnapshot();
  });
});

describe('formikToExtractionQuery', () => {
  test('can extract query', () => {
    expect(formikToExtractionQuery(FORMIK_INITIAL_VALUES)).toMatchSnapshot();
  });
});

describe('formikToGraphQuery', () => {
  test('can build graph query', () => {
    expect(
      formikToGraphQuery({ ...FORMIK_INITIAL_VALUES, timeField: '@timestamp' })
    ).toMatchSnapshot();
  });
});

describe('formikToUiGraphQuery', () => {
  test('can build ui graph query', () => {
    expect(
      formikToUiGraphQuery({ ...FORMIK_INITIAL_VALUES, timeField: '@timestamp' })
    ).toMatchSnapshot();
  });
});

describe('formikToUiOverAggregation', () => {
  test('can build over aggregation', () => {
    expect(
      formikToUiOverAggregation({ ...FORMIK_INITIAL_VALUES, timeField: '@timestamp' })
    ).toMatchSnapshot();
  });
});

describe('formikToWhenAggregation', () => {
  const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);

  test('can build when (count) aggregation', () => {
    expect(formikToMetricAggregation(formikValues)).toMatchSnapshot();
  });

  test('can build when aggregation', () => {
    formikValues.aggregationType = 'avg';
    formikValues.fieldName = [{ label: 'bytes' }];
    expect(formikToMetricAggregation(formikValues)).toMatchSnapshot();
  });
});

describe('formikToUiSchedule', () => {
  test('can build uiSchedule', () => {
    expect(
      formikToUiSchedule({ ...FORMIK_INITIAL_VALUES, timezone: [{ label: 'America/Los_Angeles' }] })
    ).toMatchSnapshot();
  });
});

describe('buildSchedule', () => {
  let formikValues;
  let uiSchedule;
  beforeEach(() => {
    formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
    formikValues.timezone = [{ label: 'America/Los_Angeles' }];
    uiSchedule = formikToUiSchedule(formikValues);
  });

  test('can build interval schedule', () => {
    expect(buildSchedule('interval', uiSchedule)).toMatchSnapshot();
  });

  test('can build daily schedule', () => {
    expect(buildSchedule('daily', uiSchedule)).toMatchSnapshot();
  });

  test('can build weekly schedule', () => {
    uiSchedule.weekly.tue = true;
    uiSchedule.weekly.thur = true;
    expect(buildSchedule('weekly', uiSchedule)).toMatchSnapshot();
  });

  test('can build monthly (day) schedule', () => {
    uiSchedule.monthly.type = 'day';
    expect(buildSchedule('monthly', uiSchedule)).toMatchSnapshot();
  });

  test('can build cron schedule', () => {
    expect(buildSchedule('cronExpression', uiSchedule)).toMatchSnapshot();
  });
});

describe('formikToWhereClause', () => {
  const numericFieldName = [{ label: 'age', type: 'number' }];
  const textField = [{ label: 'city', type: 'text' }];
  const keywordField = [{ label: 'city.keyword', type: 'keyword' }];

  test.each([
    [numericFieldName, OPERATORS_MAP.IS.value, 20, { term: { age: 20 } }],
    [textField, OPERATORS_MAP.IS.value, 'Seattle', { match_phrase: { city: 'Seattle' } }],
    [
      numericFieldName,
      OPERATORS_MAP.IS_NOT.value,
      20,
      { bool: { must_not: { term: { age: 20 } } } },
    ],
    [
      textField,
      OPERATORS_MAP.IS_NOT.value,
      'Seattle',
      { bool: { must_not: { match_phrase: { city: 'Seattle' } } } },
    ],
    [
      numericFieldName,
      OPERATORS_MAP.IS_NULL.value,
      undefined,
      { bool: { must_not: { exists: { field: 'age' } } } },
    ],
    [numericFieldName, OPERATORS_MAP.IS_NOT_NULL.value, undefined, { exists: { field: 'age' } }],
    [numericFieldName, OPERATORS_MAP.IS_GREATER.value, 20, { range: { age: { gt: 20 } } }],
    [numericFieldName, OPERATORS_MAP.IS_GREATER_EQUAL.value, 20, { range: { age: { gte: 20 } } }],
    [numericFieldName, OPERATORS_MAP.IS_LESS.value, 20, { range: { age: { lt: 20 } } }],
    [numericFieldName, OPERATORS_MAP.IS_LESS_EQUAL.value, 20, { range: { age: { lte: 20 } } }],
    [textField, OPERATORS_MAP.STARTS_WITH.value, 'Se', { prefix: { city: 'Se' } }],
    [textField, OPERATORS_MAP.ENDS_WITH.value, 'Se', { wildcard: { city: '*Se' } }],
    [
      textField,
      OPERATORS_MAP.CONTAINS.value,
      'Se',
      { query_string: { query: `*Se*`, default_field: 'city' } },
    ],
    [keywordField, OPERATORS_MAP.CONTAINS.value, 'Se', { wildcard: { 'city.keyword': '*Se*' } }],
    [
      textField,
      OPERATORS_MAP.DOES_NOT_CONTAINS.value,
      'Se',
      { bool: { must_not: { query_string: { query: `*Se*`, default_field: 'city' } } } },
    ],
  ])('.formikToWhereClause (%j,  %S)', (fieldName, operator, fieldValue, expected) => {
    expect(formikToWhereClause({ filters: [{ fieldName, operator, fieldValue }] })[0]).toEqual(
      expected
    );
  });
});
