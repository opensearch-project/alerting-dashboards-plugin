/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const TRIGGER_TYPE = {
  AD: 'anomaly_detector_trigger',
  BUCKET_LEVEL: 'bucket_level_trigger',
  ALERT_TRIGGER: 'alerting_trigger',
  QUERY_LEVEL: 'query_level_trigger',
  DOC_LEVEL: 'document_level_trigger',
};

export const FORMIK_INITIAL_BUCKET_SELECTOR_VALUES = {
  buckets_path: {
    '': '',
  },
  parent_bucket_path: 'composite_agg',
  script: {
    source: 'params.',
  },
};

export const FORMIK_INITIAL_TRIGGER_CONDITION_VALUES = {
  thresholdValue: 10000,
  thresholdEnum: 'ABOVE',
  anomalyDetector: {
    triggerType: TRIGGER_TYPE.AD,
    anomalyGradeThresholdValue: 0.7,
    anomalyGradeThresholdEnum: 'ABOVE',
    anomalyConfidenceThresholdValue: 0.7,
    anomalyConfidenceThresholdEnum: 'ABOVE',
  },
  script: {
    lang: 'painless',
    source: 'ctx.results[0].hits.total.value > 0',
  },
  buckets_path: {},
  parent_bucket_path: 'composite_agg',
  gap_policy: '',
  query: undefined,
  queryMetric: undefined,
  andOrCondition: undefined,
};

export const FORMIK_INITIAL_TRIGGER_VALUES = {
  name: '',
  severity: '1',
  minTimeBetweenExecutions: null,
  rollingWindowSize: null,
  script: {
    lang: 'painless',
    source: `ctx.results[0].hits.total.value > 0`,
  },
  bucketSelector: JSON.stringify(FORMIK_INITIAL_BUCKET_SELECTOR_VALUES, null, 4), // TODO: To be used for Bucket-Level Triggers defined by query
  triggerConditions: [],
  thresholdValue: 10000,
  thresholdEnum: 'ABOVE',
  anomalyDetector: {
    triggerType: TRIGGER_TYPE.AD,
    anomalyGradeThresholdValue: 0.7,
    anomalyGradeThresholdEnum: 'ABOVE',
    anomalyConfidenceThresholdValue: 0.7,
    anomalyConfidenceThresholdEnum: 'ABOVE',
  },
  where: {
    fieldName: [],
    operator: 'includes',
    fieldValue: '',
    fieldRangeStart: 0,
    fieldRangeEnd: 0,
  },
  actions: undefined,
};

export const FORMIK_INITIAL_DOC_LEVEL_SCRIPT = {
  lang: FORMIK_INITIAL_TRIGGER_VALUES.script.lang,
  source: '(query[name=<queryName>] || query[name=<queryName>]) && query[tag=<queryTag>]',
};

export const HITS_TOTAL_RESULTS_PATH = 'ctx.results[0].hits.total.value';
export const AGGREGATION_RESULTS_PATH = 'ctx.results[0].aggregations.metric.value';
export const ANOMALY_GRADE_RESULT_PATH = 'ctx.results[0].aggregations.max_anomaly_grade.value';
export const ANOMALY_CONFIDENCE_RESULT_PATH = 'ctx.results[0].hits.hits[0]._source.confidence';
export const NOT_EMPTY_RESULT =
  'ctx.results != null && ctx.results.length > 0 && ctx.results[0].aggregations != null && ctx.results[0].aggregations.max_anomaly_grade != null && ctx.results[0].hits.total.value > 0 && ctx.results[0].hits.hits[0]._source != null && ctx.results[0].hits.hits[0]._source.confidence != null';
