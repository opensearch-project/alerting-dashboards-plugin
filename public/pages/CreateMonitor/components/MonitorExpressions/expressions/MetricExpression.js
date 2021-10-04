/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React, { Component } from 'react';
import { connect } from 'formik';
import { EuiText, EuiButtonEmpty, EuiSpacer, EuiBadge, EuiToolTip, EuiIcon } from '@elastic/eui';
import _ from 'lodash';
import { getIndexFields } from './utils/dataTypes';
import { getMetricExpressionAllowedTypes, validateAggregationsDuplicates } from './utils/helpers';
import {
  FORMIK_INITIAL_AGG_VALUES,
  METRIC_TOOLTIP_TEXT,
} from '../../../containers/CreateMonitor/utils/constants';
import { MetricItem } from './index';
import { MONITOR_TYPE } from '../../../../../utils/constants';
import { inputLimitText } from '../../../../../utils/helpers';
import IconToolTip from '../../../../../components/IconToolTip';
import { QUERY_TYPE_METRIC_ERROR } from './utils/constants';

export const MAX_NUM_QUERY_LEVEL_METRICS = 1;
export const MAX_NUM_BUCKET_LEVEL_METRICS = 5;

class MetricExpression extends Component {
  renderFieldItems = (arrayHelpers, fieldOptions, expressionWidth) => {
    const {
      formik: { values },
    } = this.props;
    return values.aggregations.map((aggregation, index) => {
      return (
        <span style={{ paddingRight: '5px' }} key={`metric-expr-${index}`}>
          <MetricItem
            arrayHelpers={arrayHelpers}
            fieldOptions={fieldOptions}
            expressionWidth={expressionWidth}
            aggregation={aggregation}
            index={index}
          />
        </span>
      );
    });
  };

  render() {
    const {
      formik: { values },
      errors,
      arrayHelpers,
      dataTypes,
    } = this.props;

    const fieldOptions = getIndexFields(dataTypes, getMetricExpressionAllowedTypes(values));

    const expressionWidth =
      Math.max(
        ...fieldOptions.map(({ options }) =>
          options.reduce((accu, curr) => Math.max(accu, curr.label.length), 0)
        )
      ) *
        8 +
      60;

    const { monitor_type: monitorType, aggregations } = values;

    let showAddButtonFlag = false;
    const limitText =
      MONITOR_TYPE.BUCKET_LEVEL === monitorType
        ? inputLimitText(aggregations.length, MAX_NUM_BUCKET_LEVEL_METRICS, 'metric', 'metrics', {
            paddingLeft: '10px',
          })
        : inputLimitText(aggregations.length, MAX_NUM_QUERY_LEVEL_METRICS, 'metric', 'metrics', {
            paddingLeft: '10px',
          });

    if (
      MONITOR_TYPE.QUERY_LEVEL === monitorType &&
      aggregations.length < MAX_NUM_QUERY_LEVEL_METRICS
    ) {
      showAddButtonFlag = true;
    } else if (
      MONITOR_TYPE.BUCKET_LEVEL === monitorType &&
      aggregations.length < MAX_NUM_BUCKET_LEVEL_METRICS
    ) {
      showAddButtonFlag = true;
    }

    if (validateAggregationsDuplicates(aggregations)) {
      errors.aggregations = `You have defined duplicated metrics.`;
    } else if (
      MONITOR_TYPE.QUERY_LEVEL === monitorType &&
      aggregations.length > MAX_NUM_QUERY_LEVEL_METRICS
    ) {
      errors.aggregations = QUERY_TYPE_METRIC_ERROR;
    } else {
      delete errors.aggregations;
    }

    return (
      <div id="aggregations">
        <EuiText size="xs">
          <strong>Metrics</strong>
          <i> - optional </i>
          <IconToolTip content={METRIC_TOOLTIP_TEXT} iconType="questionInCircle" />
        </EuiText>
        <EuiSpacer size="s" />

        {/*For query monitor, if user choose a metric, then don't show this*/}
        {!(MONITOR_TYPE.QUERY_LEVEL === monitorType && aggregations.length > 0) && (
          <span style={{ paddingRight: '5px' }}>
            <EuiBadge color="hollow" style={{ paddingRight: '5px' }}>
              COUNT OF documents
            </EuiBadge>
          </span>
        )}

        {this.renderFieldItems(arrayHelpers, fieldOptions, expressionWidth)}
        <EuiSpacer size="xs" />

        <EuiText color="danger" size="xs">
          {errors.aggregations}
        </EuiText>

        {showAddButtonFlag && (
          <EuiButtonEmpty
            size="xs"
            onClick={() => {
              arrayHelpers.push(_.cloneDeep(FORMIK_INITIAL_AGG_VALUES));
            }}
            data-test-subj="addMetricButton"
            style={{ paddingTop: '5px' }}
          >
            + Add metric
          </EuiButtonEmpty>
        )}

        {limitText}
      </div>
    );
  }
}

export default connect(MetricExpression);
