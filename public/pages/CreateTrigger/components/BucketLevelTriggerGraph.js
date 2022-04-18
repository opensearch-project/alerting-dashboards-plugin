/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import BucketLevelTriggerExpression from './BucketLevelTriggerExpression';
import { DEFAULT_METRIC_AGGREGATION } from '../containers/DefineBucketLevelTrigger/DefineBucketLevelTrigger';
import _ from 'lodash';
import { DEFAULT_AND_OR_CONDITION } from '../utils/constants';

const BucketLevelTriggerGraph = ({
  arrayHelpers,
  index,
  fieldPath,
  monitorValues,
  triggerValues,
  response,
  queryMetrics,
}) => {
  const fieldNamePath = `${fieldPath}triggerConditions[${index}].`;
  let andOrCondition = _.get(triggerValues, `${fieldNamePath}andOrCondition`);
  if (index > 0 && _.isEmpty(andOrCondition)) {
    andOrCondition = DEFAULT_AND_OR_CONDITION;
    _.set(triggerValues, `${fieldNamePath}andOrCondition`, andOrCondition);
  }

  const queryMetric = _.get(
    triggerValues,
    `${fieldNamePath}queryMetric`,
    DEFAULT_METRIC_AGGREGATION.value
  );
  _.set(triggerValues, `${fieldNamePath}queryMetric`, queryMetric);

  const thresholdEnum = _.get(triggerValues, `${fieldNamePath}thresholdEnum`);
  const thresholdValue = _.get(triggerValues, `${fieldNamePath}thresholdValue`);

  return (
    <div style={{ padding: '0px 10px' }}>
      <BucketLevelTriggerExpression
        arrayHelpers={arrayHelpers}
        index={index}
        andOrCondition={andOrCondition}
        queryMetric={queryMetric}
        queryMetrics={queryMetrics}
        thresholdEnum={thresholdEnum}
        thresholdValue={thresholdValue}
        andOrConditionFieldName={`${fieldNamePath}andOrCondition`}
        queryMetricFieldName={`${fieldNamePath}queryMetric`}
        enumFieldName={`${fieldNamePath}thresholdEnum`}
        valueFieldName={`${fieldNamePath}thresholdValue`}
        label="Trigger conditions"
      />
      {/*TODO: Implement VisualGraph illustrating the trigger expression similar to the implementation in TriggerGraph.js*/}
    </div>
  );
};

export default BucketLevelTriggerGraph;
