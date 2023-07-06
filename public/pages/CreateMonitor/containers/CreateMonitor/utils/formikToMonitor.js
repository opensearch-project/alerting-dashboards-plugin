/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import moment from 'moment-timezone';
import { BUCKET_COUNT, DEFAULT_COMPOSITE_AGG_SIZE, FORMIK_INITIAL_VALUES } from './constants';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../../utils/constants';
import { OPERATORS_QUERY_MAP } from './whereFilters';
import {
  API_TYPES,
  URL_DEFAULT_PREFIX,
} from '../../../components/ClusterMetricsMonitor/utils/clusterMetricsMonitorConstants';
import {
  getApiPath,
  getApiType,
} from '../../../components/ClusterMetricsMonitor/utils/clusterMetricsMonitorHelpers';
import {
  DOC_LEVEL_INPUT_FIELD,
  DOC_LEVEL_QUERY_MAP,
} from '../../../components/DocumentLevelMonitorQueries/utils/constants';

export function formikToMonitor(values) {
  const uiSchedule = formikToUiSchedule(values);
  const schedule = buildSchedule(values.frequency, uiSchedule);

  const monitorUiMetadata = () => {
    switch (values.monitor_type) {
      case MONITOR_TYPE.DOC_LEVEL:
        return {
          [DOC_LEVEL_INPUT_FIELD]: formikToDocLevelQueriesUiMetadata(values),
          search: { searchType: values.searchType },
        };
      default:
        return { search: formikToUiSearch(values) };
    }
  };

  return {
    name: values.name,
    type: 'monitor',
    monitor_type: values.monitor_type,
    enabled: !values.disabled,
    schedule,
    inputs: [formikToInputs(values)],
    triggers: [],
    ui_metadata: {
      schedule: uiSchedule,
      monitor_type: values.monitor_type,
      ...monitorUiMetadata(),
    },
  };
}

export function formikToInputs(values) {
  switch (values.monitor_type) {
    case MONITOR_TYPE.CLUSTER_METRICS:
      return formikToClusterMetricsInput(values);
    case MONITOR_TYPE.DOC_LEVEL:
      return formikToDocLevelInput(values);
    default:
      return formikToSearch(values);
  }
}

export function formikToSearch(values) {
  const isAD = values.searchType === SEARCH_TYPE.AD;
  let query = isAD ? formikToAdQuery(values) : formikToQuery(values);
  const adResultIndex = _.get(values, 'adResultIndex', '.opendistro-anomaly-results*');
  const indices = isAD ? [adResultIndex] : formikToIndices(values);

  return {
    search: {
      indices,
      query,
    },
  };
}

export function formikToAdQuery(values) {
  return {
    size: 1,
    sort: [{ anomaly_grade: 'desc' }, { confidence: 'desc' }],
    query: {
      bool: {
        filter: [
          {
            range: {
              execution_end_time: {
                from: '{{period_end}}||-' + values.period.interval + 'm',
                to: '{{period_end}}',
                include_lower: true,
                include_upper: true,
              },
            },
          },
          {
            term: {
              detector_id: {
                value: values.detectorId,
              },
            },
          },
        ],
      },
    },
    aggregations: {
      max_anomaly_grade: {
        max: {
          field: 'anomaly_grade',
        },
      },
    },
  };
}

export function formikToClusterMetricsInput(values) {
  let apiType = _.get(values, 'uri.api_type', FORMIK_INITIAL_VALUES.uri.api_type);
  if (_.isEmpty(apiType)) apiType = getApiType(_.get(values, 'uri'));
  let pathParams = _.get(values, 'uri.path_params', FORMIK_INITIAL_VALUES.uri.path_params);
  pathParams = _.trim(pathParams);
  const hasPathParams = !_.isEmpty(pathParams);
  const path = getApiPath(hasPathParams, apiType);
  let url = FORMIK_INITIAL_VALUES.uri.url;
  if (!_.isEmpty(apiType)) {
    url = URL_DEFAULT_PREFIX;
    if (!_.isEmpty(path)) url = url + '/' + path;
    if (hasPathParams) url = url + '/' + pathParams + _.get(API_TYPES, `${apiType}.appendText`, '');
  }
  return {
    uri: {
      api_type: apiType,
      path: path,
      path_params: pathParams,
      url: url,
    },
  };
}

export function formikToAd(values) {
  return {
    anomaly_detector: {
      detector_id: values.detectorId,
    },
  };
}

export function formikToUiSearch(values) {
  const { searchType, timeField, aggregations, groupBy, bucketValue, bucketUnitOfTime, filters } =
    values;
  return {
    searchType,
    timeField,
    aggregations,
    groupBy,
    bucketValue,
    bucketUnitOfTime,
    filters,
  };
}

export function formikToIndices(values) {
  return values.index.map(({ label }) => label);
}

export function formikToQuery(values) {
  const isGraph = values.searchType === SEARCH_TYPE.GRAPH;
  return isGraph ? formikToGraphQuery(values) : formikToExtractionQuery(values);
}

export function formikToExtractionQuery(values) {
  let query = _.get(values, 'query', FORMIK_INITIAL_VALUES.query);
  try {
    // JSON.parse() throws an exception when the argument is a malformed JSON string.
    // This caused exceptions when tinkering with the JSON in the code editor.
    // This try/catch block will only parse the JSON string if it is not malformed.
    // It will otherwise store the JSON as a string for continued editing.
    query = JSON.parse(query);
  } catch (err) {}
  return query;
}

export function formikToGraphQuery(values) {
  const { bucketValue, bucketUnitOfTime, monitor_type } = values;

  const aggregation = () => {
    switch (monitor_type) {
      case MONITOR_TYPE.BUCKET_LEVEL:
        return formikToCompositeAggregation(values);
      default:
        return formikToAggregation(values);
    }
  };
  const timeField = values.timeField;
  let filters = [
    {
      range: {
        [timeField]: {
          gte: `{{period_end}}||-${Math.round(bucketValue)}${bucketUnitOfTime}`,
          lte: '{{period_end}}',
          format: 'epoch_millis',
        },
      },
    },
  ];
  const whereFilters = formikToWhereClause(values);
  if (whereFilters.length) filters = filters.concat(whereFilters);
  return {
    size: 0,
    aggregations: aggregation(),
    query: {
      bool: {
        filter: filters,
      },
    },
  };
}

export function formikToDocLevelInput(values) {
  let description = FORMIK_INITIAL_VALUES.description;
  let indices = formikToIndices(values);
  let queries = _.get(values, 'queries', FORMIK_INITIAL_VALUES.queries);
  switch (values.searchType) {
    case SEARCH_TYPE.GRAPH:
      description = values.description;
      queries = queries.map((query) => {
        const formikToQuery = DOC_LEVEL_QUERY_MAP[query.operator].query(query);
        return {
          id: query.id,
          name: query.queryName,
          query: formikToQuery,
          tags: query.tags,
        };
      });
      break;
    case SEARCH_TYPE.QUERY:
      let query = _.get(values, 'query', '');
      try {
        query = JSON.parse(query);
        description = _.get(query, 'description', description);
        queries = _.get(query, 'queries', queries);
      } catch (e) {
        /* Ignore JSON parsing errors as users may just be configuring the query */
      }
      break;
    default:
      console.log(
        `Unsupported searchType found for ${MONITOR_TYPE.DOC_LEVEL}: ${JSON.stringify(
          values.searchType
        )}`,
        values.searchType
      );
  }

  return {
    [DOC_LEVEL_INPUT_FIELD]: {
      description: description,
      indices: indices,
      queries: queries,
    },
  };
}

export function formikToDocLevelQueriesUiMetadata(values) {
  return { queries: _.get(values, 'queries', []) };
}

export function formikToCompositeAggregation(values) {
  const { aggregations, groupBy } = values;

  let aggs = {};
  aggregations.map((aggItem) => {
    // TODO: Changing any occurrence of '.' in the fieldName to '_' since the
    //  bucketSelector uses the '.' syntax to resolve aggregation paths.
    //  Should revisit this as replacing with `_` could cause collisions with fields named like that.
    const name = `${aggItem.aggregationType}_${aggItem.fieldName.replace(/\./g, '_')}`;
    const type = aggItem.aggregationType === 'count' ? 'value_count' : aggItem.aggregationType;
    aggs[name] = {
      [type]: { field: aggItem.fieldName },
    };
  });
  let sources = [];
  groupBy.map((groupByItem) =>
    sources.push({
      [groupByItem]: {
        terms: {
          field: groupByItem,
        },
      },
    })
  );
  return {
    composite_agg: {
      composite: { sources },
      aggs,
    },
  };
}

// For aggregations of query-level monitor
export function formikToAggregation(values) {
  const { aggregations, groupBy } = values;

  let aggs = {};
  aggregations.map((aggItem) => {
    const type = aggItem.aggregationType === 'count' ? 'value_count' : aggItem.aggregationType;
    aggs['metric'] = {
      [type]: { field: aggItem.fieldName },
    };
  });
  if (groupBy.length)
    aggs.terms_agg = {
      terms: {
        field: groupBy[0],
      },
    };
  return aggs;
}

/////////// Build Graph UI Search Request ///////////////

export function formikToUiGraphQuery(values) {
  const { bucketValue, bucketUnitOfTime, monitor_type } = values;
  const useComposite = monitor_type === MONITOR_TYPE.BUCKET_LEVEL;
  const aggregation = useComposite
    ? formikToUiCompositeAggregation(values)
    : formikToUiOverAggregation(values);
  const timeField = values.timeField;
  let filters = [
    {
      range: {
        [timeField]: {
          // default range window to [BUCKET_COUNT] * the date histogram interval
          gte: `now-${bucketValue * BUCKET_COUNT}${bucketUnitOfTime}`,
          lte: 'now',
        },
      },
    },
  ];
  const whereFilters = formikToWhereClause(values);
  if (whereFilters.length) filters = filters.concat(whereFilters);
  return {
    size: 0,
    aggregations: aggregation,
    query: {
      bool: {
        filter: filters,
      },
    },
  };
}

export function formikToUiOverAggregation(values) {
  const metricAggregation = formikToMetricAggregation(values);
  const { bucketValue, bucketUnitOfTime, groupBy } = values;
  const timeField = values.timeField;
  const aggregations = groupBy.length
    ? {
        ...metricAggregation,
        terms_agg: {
          terms: {
            field: groupBy[0],
          },
        },
      }
    : metricAggregation;

  return {
    over: {
      date_histogram: {
        field: timeField,
        interval: `${bucketValue}${bucketUnitOfTime}`,
        time_zone: moment.tz.guess(),
        min_doc_count: 0,
        extended_bounds: {
          min: `now-${bucketValue * BUCKET_COUNT}${bucketUnitOfTime}`,
          max: 'now',
        },
      },
      aggregations,
    },
  };
}

export function formikToWhereClause({ filters = [] }) {
  return filters.map((filter) => OPERATORS_QUERY_MAP[filter.operator].query(filter));
}

// For query-level monitor single metric selection
export function formikToMetricAggregation(values) {
  const { aggregations } = values;
  let aggregationType = aggregations[0]?.aggregationType;
  const field = aggregations[0]?.fieldName;
  if (!field) return {};
  if (aggregationType === 'count') aggregationType = 'value_count';
  return { metric: { [aggregationType]: { field } } };
}

export function formikToUiCompositeAggregation(values) {
  const {
    aggregations,
    groupBy,
    timeField,
    bucketValue,
    bucketUnitOfTime,
    monitor_type: monitorType,
  } = values;

  let aggs = {};
  aggregations.map((aggItem) => {
    // TODO: Changing any occurrence of '.' in the fieldName to '_' since the
    //  bucketSelector uses the '.' syntax to resolve aggregation paths.
    //  Should revisit this as replacing with `_` could cause collisions with fields named like that.
    const name = `${aggItem.aggregationType}_${aggItem.fieldName.replace(/\./g, '_')}`;
    const type = aggItem.aggregationType === 'count' ? 'value_count' : aggItem.aggregationType;
    aggs[name] = {
      [type]: { field: aggItem.fieldName },
    };
  });

  let sources = [];
  groupBy.map((groupByItem) =>
    sources.push({
      [groupByItem]: {
        terms: {
          field: groupByItem,
        },
      },
    })
  );
  sources.push({
    date: {
      date_histogram: {
        field: timeField,
        interval: `${bucketValue}${bucketUnitOfTime}`,
        time_zone: moment.tz.guess(),
      },
    },
  });
  return {
    composite_agg: {
      composite: {
        sources,
        size: DEFAULT_COMPOSITE_AGG_SIZE,
      },
      aggs,
    },
  };
}

export function formikToUiSchedule(values) {
  return {
    timezone: _.get(values, 'timezone[0].label', null),
    frequency: values.frequency,
    period: values.period,
    daily: values.daily,
    weekly: values.weekly,
    monthly: values.monthly,
    cronExpression: values.cronExpression,
  };
}

export function buildSchedule(scheduleType, values) {
  const {
    period,
    daily,
    weekly,
    monthly: { type, day },
    cronExpression,
    timezone,
  } = values;
  switch (scheduleType) {
    case 'interval': {
      return { period };
    }
    case 'daily': {
      return { cron: { expression: `0 ${daily} * * *`, timezone } };
    }
    case 'weekly': {
      const daysOfWeek = Object.entries(weekly)
        .filter(([day, checked]) => checked)
        .map(([day]) => day.toUpperCase())
        .join(',');
      return { cron: { expression: `0 ${daily} * * ${daysOfWeek}`, timezone } };
    }
    case 'monthly': {
      let dayOfMonth = '?';
      if (type === 'day') {
        dayOfMonth = day;
      }
      return { cron: { expression: `0 ${daily} ${dayOfMonth} */1 *`, timezone } };
    }
    case 'cronExpression':
      return { cron: { expression: cronExpression, timezone } };
  }
}
