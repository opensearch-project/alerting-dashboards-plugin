/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import moment from 'moment-timezone';
import { BUCKET_COUNT, DEFAULT_COMPOSITE_AGG_SIZE, FORMIK_INITIAL_VALUES } from './constants';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../../utils/constants';
import { OPERATORS_QUERY_MAP } from './whereFilters';

export function formikToMonitor(values) {
  const uiSchedule = formikToUiSchedule(values);
  const schedule = buildSchedule(values.frequency, uiSchedule);
  const uiSearch = formikToUiSearch(values);
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
      search: uiSearch,
      monitor_type: values.monitor_type,
    },
  };
}

export function formikToInputs(values) {
  switch (values.searchType) {
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

export function formikToAd(values) {
  return {
    anomaly_detector: {
      detector_id: values.detectorId,
    },
  };
}

export function formikToUiSearch(values) {
  const {
    searchType,
    timeField,
    aggregations,
    groupBy,
    bucketValue,
    bucketUnitOfTime,
    where,
  } = values;
  return {
    searchType,
    timeField,
    aggregations,
    groupBy,
    bucketValue,
    bucketUnitOfTime,
    where,
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
  const useComposite = monitor_type === MONITOR_TYPE.BUCKET_LEVEL;
  const aggregation = useComposite
    ? formikToCompositeAggregation(values)
    : formikToAggregation(values);
  const timeField = values.timeField;
  const filters = [
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
  const whereClause = formikToWhereClause(values);
  if (whereClause) {
    filters.push({ ...whereClause });
  }
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
  const filters = [
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
  const whereClause = formikToWhereClause(values);
  if (whereClause) {
    filters.push({ ...whereClause });
  }
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

export function formikToWhereClause({ where }) {
  if (where.fieldName.length > 0) {
    return OPERATORS_QUERY_MAP[where.operator].query(where);
  }
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
