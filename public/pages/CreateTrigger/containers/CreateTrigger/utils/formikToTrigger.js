/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import {
  AGGREGATION_RESULTS_PATH,
  ANOMALY_CONFIDENCE_RESULT_PATH,
  ANOMALY_GRADE_RESULT_PATH,
  FORMIK_INITIAL_TRIGGER_VALUES,
  HITS_TOTAL_RESULTS_PATH,
  NOT_EMPTY_RESULT,
  TRIGGER_TYPE,
} from './constants';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../../utils/constants';
import { NOTIFY_OPTIONS_VALUES } from '../../../components/Action/actions/Message';
import { FORMIK_INITIAL_ACTION_VALUES } from '../../../utils/constants';

export function formikToTrigger(values, monitorUiMetadata = {}) {
  const triggerDefinitions = _.get(values, 'triggerDefinitions');
  return _.isArray(triggerDefinitions)
    ? formikToTriggerDefinitions(triggerDefinitions, monitorUiMetadata)
    : formikToTriggerDefinition(values, monitorUiMetadata);
}

export function formikToTriggerDefinitions(values, monitorUiMetadata) {
  return values.map((trigger) => formikToTriggerDefinition(trigger, monitorUiMetadata));
}

export function formikToTriggerDefinition(values, monitorUiMetadata) {
  switch (monitorUiMetadata.monitor_type) {
    case MONITOR_TYPE.BUCKET_LEVEL:
      return formikToBucketLevelTrigger(values, monitorUiMetadata);
    case MONITOR_TYPE.DOC_LEVEL:
      return formikToDocumentLevelTrigger(values, monitorUiMetadata);
    default:
      return formikToQueryLevelTrigger(values, monitorUiMetadata);
  }
}

export function formikToQueryLevelTrigger(values, monitorUiMetadata) {
  const condition = formikToCondition(values, monitorUiMetadata);
  const actions = formikToAction(values);
  // TODO: We probably also want to wrap this with 'query_level_trigger' after
  //  confirming what will break in the frontend (when accessing the fields)
  return {
    id: values.id,
    name: values.name,
    severity: values.severity,
    condition,
    actions: actions,
    min_time_between_executions: values.minTimeBetweenExecutions,
    rolling_window_size: values.rollingWindowSize,
  };
}

export function formikToBucketLevelTrigger(values, monitorUiMetadata) {
  const condition = formikToBucketLevelTriggerCondition(values, monitorUiMetadata);
  const actions = formikToBucketLevelTriggerAction(values);
  return {
    bucket_level_trigger: {
      id: values.id,
      name: values.name,
      severity: values.severity,
      condition,
      actions: actions,
      min_time_between_executions: values.minTimeBetweenExecutions,
      rolling_window_size: values.rollingWindowSize,
    },
  };
}

export function formikToDocumentLevelTrigger(values, monitorUiMetadata) {
  const condition = formikToDocumentLevelTriggerCondition(values, monitorUiMetadata);
  const actions = formikToBucketLevelTriggerAction(values);
  return {
    document_level_trigger: {
      id: values.id,
      name: values.name,
      severity: values.severity,
      condition: condition,
      actions: actions,
    },
  };
}

export function formikToDocumentLevelTriggerCondition(values, monitorUiMetadata) {
  const triggerConditions = _.get(values, 'triggerConditions', []);
  const searchType = _.get(monitorUiMetadata, 'search.searchType', SEARCH_TYPE.QUERY);
  if (searchType === SEARCH_TYPE.QUERY) return { script: values.script };
  const source = getDocumentLevelScriptSource(triggerConditions);
  return {
    script: {
      lang: 'painless',
      source: source,
    },
  };
}

export function getDocumentLevelScriptSource(conditions) {
  const scriptSourceContents = [];
  conditions.forEach((condition) => {
    const { andOrCondition, query } = condition;
    if (andOrCondition) {
      const logicOperator = getLogicalOperator(andOrCondition);
      scriptSourceContents.push(logicOperator);
    }
    if (!_.isEmpty(query) && !_.isEmpty(query.queryName)) {
      const queryExpression = _.get(query, 'expression');
      const operator = query.operator === '!=' ? '!' : '';
      scriptSourceContents.push(`${operator}query[${queryExpression}]`);
    }
  });
  return scriptSourceContents.join(' ');
}

export function formikToAction(values) {
  const actions = values.actions;
  if (actions && actions.length > 0) {
    return actions.map((action) => {
      if (!action.throttle_enabled) return _.omit(action, ['throttle']);
      return action;
    });
  }
  return actions;
}

export function formikToBucketLevelTriggerAction(values) {
  const actions = values.actions;
  const executionPolicyPath = 'action_execution_policy.action_execution_scope';
  if (actions && actions.length > 0) {
    return actions.map((action) => {
      let formattedAction = _.cloneDeep(action);

      switch (formattedAction.throttle_enabled) {
        case true:
          _.set(formattedAction, 'throttle.unit', FORMIK_INITIAL_ACTION_VALUES.throttle.unit);
          break;
        case false:
          formattedAction = _.omit(formattedAction, ['throttle']);
          break;
      }

      const notifyOption = _.get(formattedAction, `${executionPolicyPath}`);
      const notifyOptionId = _.isString(notifyOption) ? notifyOption : _.keys(notifyOption)[0];
      switch (notifyOptionId) {
        case NOTIFY_OPTIONS_VALUES.PER_ALERT:
          const actionableAlerts = _.get(
            formattedAction,
            `${executionPolicyPath}.${NOTIFY_OPTIONS_VALUES.PER_ALERT}.actionable_alerts`,
            []
          );
          _.set(
            formattedAction,
            `${executionPolicyPath}.${NOTIFY_OPTIONS_VALUES.PER_ALERT}.actionable_alerts`,
            actionableAlerts.map((entry) => entry.value)
          );
          break;
        case NOTIFY_OPTIONS_VALUES.PER_EXECUTION:
          _.set(
            formattedAction,
            `${executionPolicyPath}.${NOTIFY_OPTIONS_VALUES.PER_EXECUTION}`,
            {}
          );
          break;
      }
      return formattedAction;
    });
  }
  return actions;
}

export function formikToTriggerUiMetadata(values, monitorUiMetadata) {
  switch (monitorUiMetadata.monitor_type) {
    case MONITOR_TYPE.QUERY_LEVEL:
    case MONITOR_TYPE.CLUSTER_METRICS:
      const searchType = _.get(monitorUiMetadata, 'search.searchType', 'query');
      const queryLevelTriggersUiMetadata = {};
      _.get(values, 'triggerDefinitions', []).forEach((trigger) => {
        const { anomalyDetector, thresholdEnum, thresholdValue } = trigger;
        const triggerMetadata = { value: thresholdValue, enum: thresholdEnum };

        //Store AD values only if AD trigger.
        if (searchType === SEARCH_TYPE.AD && anomalyDetector.triggerType === TRIGGER_TYPE.AD) {
          triggerMetadata.adTriggerMetadata = {
            triggerType: anomalyDetector.triggerType,
            anomalyGrade: {
              value: anomalyDetector.anomalyGradeThresholdValue,
              enum: anomalyDetector.anomalyGradeThresholdEnum,
            },
            anomalyConfidence: {
              value: anomalyDetector.anomalyConfidenceThresholdValue,
              enum: anomalyDetector.anomalyConfidenceThresholdEnum,
            },
          };
        }

        queryLevelTriggersUiMetadata[trigger.name] = triggerMetadata;
      });
      return queryLevelTriggersUiMetadata;

    case MONITOR_TYPE.BUCKET_LEVEL:
      const bucketLevelTriggersUiMetadata = {};
      _.get(values, 'triggerDefinitions', []).forEach((trigger) => {
        const triggerMetadata = trigger.triggerConditions.map((condition) => ({
          value: condition.thresholdValue,
          enum: condition.thresholdEnum,
        }));
        bucketLevelTriggersUiMetadata[trigger.name] = triggerMetadata;
      });
      return bucketLevelTriggersUiMetadata;
    case MONITOR_TYPE.DOC_LEVEL:
      const docLevelTriggersUiMetadata = {};
      _.get(values, 'triggerDefinitions', []).forEach((trigger) => {
        const triggerMetadata = _.get(trigger, 'triggerConditions', []).map((condition) => ({
          query: condition.query,
          andOrCondition: condition.andOrCondition,
          script: condition.script,
        }));
        docLevelTriggersUiMetadata[trigger.name] = triggerMetadata;
      });
      return docLevelTriggersUiMetadata;
  }
}

export function formikToCondition(values, monitorUiMetadata = {}) {
  const { thresholdValue, thresholdEnum } = values;
  const searchType = _.get(monitorUiMetadata, 'search.searchType', 'query');
  const aggregationType = _.get(monitorUiMetadata, 'search.aggregations.0.aggregationType');

  if (searchType === SEARCH_TYPE.QUERY || searchType === SEARCH_TYPE.CLUSTER_METRICS)
    return { script: values.script };
  if (searchType === SEARCH_TYPE.AD) return getADCondition(values);

  // If no aggregation type defined, default to count of documents situation
  const isCount = !aggregationType;
  const resultsPath = getResultsPath(isCount);
  const operator = getRelationalOperator(thresholdEnum);
  return getCondition(resultsPath, operator, thresholdValue, isCount);
}

export function formikToBucketLevelTriggerCondition(values, monitorUiMetadata = {}) {
  const searchType = _.get(monitorUiMetadata, 'search.searchType', SEARCH_TYPE.QUERY);

  let bucketSelector = _.get(
    values,
    'bucketSelector',
    FORMIK_INITIAL_TRIGGER_VALUES.bucketSelector
  );
  try {
    // JSON.parse() throws an exception when the argument is a malformed JSON string.
    // This caused exceptions when tinkering with the JSON in the code editor.
    // This try/catch block will only parse the JSON string if it is not malformed.
    // It will otherwise store the JSON as a string for continued editing.
    bucketSelector = JSON.parse(bucketSelector);
  } catch (err) {}

  if (searchType === SEARCH_TYPE.QUERY) return bucketSelector;
  if (searchType === SEARCH_TYPE.GRAPH) return getBucketLevelTriggerCondition(values);
}

export function getADCondition(values) {
  const { anomalyDetector } = values;
  if (anomalyDetector.triggerType === TRIGGER_TYPE.AD) {
    const anomalyGradeOperator = getRelationalOperator(anomalyDetector.anomalyGradeThresholdEnum);
    const anomalyConfidenceOperator = getRelationalOperator(
      anomalyDetector.anomalyConfidenceThresholdEnum
    );
    return {
      script: {
        lang: 'painless',
        source: `return ${NOT_EMPTY_RESULT} && ${ANOMALY_GRADE_RESULT_PATH} != null && ${ANOMALY_GRADE_RESULT_PATH} ${anomalyGradeOperator} ${anomalyDetector.anomalyGradeThresholdValue} && ${ANOMALY_CONFIDENCE_RESULT_PATH} ${anomalyConfidenceOperator} ${anomalyDetector.anomalyConfidenceThresholdValue}`,
      },
    };
  } else {
    return { script: values.script };
  }
}

export function getCondition(resultsPath, operator, value, isCount) {
  const baseSource = `${resultsPath} ${operator} ${value}`;
  return {
    script: {
      lang: 'painless',
      source: isCount ? baseSource : `return ${resultsPath} == null ? false : ${baseSource}`,
    },
  };
}

export function getBucketLevelTriggerCondition(values) {
  const conditions = values.triggerConditions;
  const bucketsPath = getBucketSelectorBucketsPath(conditions);
  const scriptSource = getBucketSelectorScriptSource(conditions);
  const composite_agg_filter = getCompositeAggFilter(values);

  return {
    parent_bucket_path: 'composite_agg',
    buckets_path: bucketsPath,
    script: {
      source: scriptSource,
    },
    composite_agg_filter: composite_agg_filter,
  };
}

export function getBucketSelectorBucketsPath(conditions) {
  const bucketsPath = {};
  conditions.forEach((condition) => {
    const { queryMetric } = condition;
    bucketsPath[queryMetric] = queryMetric;
  });
  return bucketsPath;
}

export function getBucketSelectorScriptSource(conditions) {
  const scriptSourceContents = [];
  conditions.forEach((condition) => {
    const { queryMetric, thresholdValue, thresholdEnum, andOrCondition } = condition;
    if (andOrCondition) {
      // TODO: If possible, adding parentheses around the AND statements of the resulting script
      //  would improve readability but it shouldn't affect the logical result
      const logicalOperator = getLogicalOperator(andOrCondition);
      scriptSourceContents.push(logicalOperator);
    }
    const relationalOperator = getRelationalOperator(thresholdEnum);
    const scriptCondition = `params.${queryMetric} ${relationalOperator} ${thresholdValue}`;
    scriptSourceContents.push(scriptCondition);
  });
  return scriptSourceContents.join(' ');
}

export function getResultsPath(isCount) {
  return isCount ? HITS_TOTAL_RESULTS_PATH : AGGREGATION_RESULTS_PATH;
}

export function getCompositeAggFilter({ where }) {
  const fieldName = _.get(where, 'fieldName', FORMIK_INITIAL_TRIGGER_VALUES.where.fieldName);
  const composite_agg_filter = {};
  if (fieldName.length > 0) {
    composite_agg_filter[where.fieldName[0].label] = {
      [where.operator]: where.fieldValue,
    };
    return composite_agg_filter;
  }
}

export function getRelationalOperator(thresholdEnum) {
  return { ABOVE: '>', BELOW: '<', EXACTLY: '==' }[thresholdEnum];
}

export function getLogicalOperator(logicalEnum) {
  return { AND: '&&', OR: '||' }[logicalEnum];
}
