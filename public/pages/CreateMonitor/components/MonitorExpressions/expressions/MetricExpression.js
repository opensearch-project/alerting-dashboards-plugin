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

import { EuiText, EuiButtonEmpty, EuiSpacer, EuiPopover } from '@elastic/eui';
import { getIndexFields } from './utils/dataTypes';
import { getMetricExpressionAllowedTypes, getOfExpressionAllowedTypes } from './utils/helpers';
import _ from 'lodash';
import {
  FORMIK_INITIAL_AGG_VALUES,
  FORMIK_INITIAL_VALUES,
} from '../../../containers/CreateMonitor/utils/constants';
import { MetricItem } from './index';
import { Expressions } from './utils/constants';
import MetricPopover from './MetricPopover';

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
        <span style={{ paddingRight: '5px' }}>
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
      arrayHelpers,
      closeExpression,
      openExpression,
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
    return (
      <div>
        <EuiText size="xs">
          <h4>Metrics</h4>
        </EuiText>
        <EuiSpacer size="s" />
        {this.renderFieldItems(
          arrayHelpers,
          fieldOptions,
          openExpression,
          closeExpression,
          expressionWidth
        )}
        <EuiSpacer size="xs" />
        <EuiButtonEmpty
          size="xs"
          onClick={() => {
            arrayHelpers.push(_.cloneDeep(FORMIK_INITIAL_AGG_VALUES));
          }}
          data-test-subj="addMetricButton"
        >
          + Add metric
        </EuiButtonEmpty>
      </div>
    );
  }
}

export default connect(MetricExpression);
