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

import React, { Component } from 'react';
import { connect } from 'formik';

import { EuiText, EuiButtonEmpty, EuiSpacer, EuiBadge } from '@elastic/eui';
import { getIndexFields } from './utils/dataTypes';
import { getMetricExpressionAllowedTypes } from './utils/helpers';
import _ from 'lodash';
import { FORMIK_INITIAL_AGG_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import { MetricItem } from './index';
import { MONITOR_TYPE } from '../../../../../utils/constants';

class MetricExpression extends Component {
  renderFieldItems = (arrayHelpers, fieldOptions, expressionWidth) => {
    const {
      formik: { values },
      onMadeChanges,
      openExpression,
      closeExpression,
    } = this.props;
    return values.aggregations.map((aggregation, index) => {
      return (
        <span style={{ paddingRight: '5px' }} key={`metric-expr-${index}`}>
          <MetricItem
            values={values}
            onMadeChanges={onMadeChanges}
            arrayHelpers={arrayHelpers}
            fieldOptions={fieldOptions}
            expressionWidth={expressionWidth}
            aggregation={aggregation}
            index={index}
            openExpression={openExpression}
            closeExpression={closeExpression}
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
    if (MONITOR_TYPE.QUERY_LEVEL === monitorType && aggregations.length < 1) {
      showAddButtonFlag = true;
    } else if (MONITOR_TYPE.BUCKET_LEVEL === monitorType && aggregations.length < 5) {
      showAddButtonFlag = true;
    }

    let duplicates = new Set();
    aggregations.forEach((e1, index) => {
      aggregations.slice(index + 1).forEach((e2) => {
        if (e1.aggregationType === e2.aggregationType && e1.fieldName === e2.fieldName) {
          duplicates.add(`${e1.aggregationType} of ${e1.fieldName}`);
        }
      });
    });

    if (duplicates.size > 0) {
      errors.aggregations = `You have defined duplicated metrics: ${[...duplicates]}.`;
    } else {
      errors.aggregations = undefined;
    }

    return (
      <div>
        <EuiText size="xs">
          <h4>Metrics</h4>
        </EuiText>
        <EuiSpacer size="s" />

        <span style={{ paddingRight: '5px' }}>
          <EuiBadge color="hollow" style={{ paddingRight: '5px' }}>
            COUNT OF documents
          </EuiBadge>
        </span>

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
          >
            + Add another metric
          </EuiButtonEmpty>
        )}
      </div>
    );
  }
}

export default connect(MetricExpression);
