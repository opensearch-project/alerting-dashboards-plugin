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

import { EuiText, EuiButtonEmpty, EuiSpacer } from '@elastic/eui';
import { getIndexFields } from './utils/dataTypes';
import { getGroupByExpressionAllowedTypes } from './utils/helpers';
import GroupByItem from './GroupByItem';
import { GROUP_BY_ERROR } from './utils/constants';
import { MONITOR_TYPE } from '../../../../../utils/constants';

class GroupByExpression extends Component {
  state = {
    addButtonTouched: false,
  };
  renderFieldItems = (arrayHelpers, fieldOptions, expressionWidth) => {
    const {
      formik: { values },
      onMadeChanges,
      openExpression,
      closeExpression,
    } = this.props;
    return values.groupBy.map((groupByItem, index) => {
      return (
        <span style={{ paddingRight: '5px' }} key={`group-by-expr-${index}`}>
          <GroupByItem
            values={values}
            onMadeChanges={onMadeChanges}
            arrayHelpers={arrayHelpers}
            fieldOptions={fieldOptions}
            expressionWidth={expressionWidth}
            groupByItem={groupByItem}
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
      touched,
      arrayHelpers,
      dataTypes,
    } = this.props;

    const fieldOptions = getIndexFields(dataTypes, getGroupByExpressionAllowedTypes(values));
    const defaultOption = fieldOptions[0]?.options[0];

    const expressionWidth =
      Math.max(
        ...fieldOptions.map(({ options }) =>
          options.reduce((accu, curr) => Math.max(accu, curr.label.length), 0)
        )
      ) *
        8 +
      60;

    if (
      (this.state.addButtonTouched || touched.groupBy) &&
      !values.groupBy.length &&
      values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL
    )
      errors.groupBy = GROUP_BY_ERROR;

    return (
      <div>
        <EuiText size="xs">
          <h4>Group by</h4>
        </EuiText>
        <EuiSpacer size="s" />

        {values.groupBy.length === 0 && (
          <div style={{ padding: '10px 0px' }}>
            <p>No group bys defined.</p>
          </div>
        )}

        {this.renderFieldItems(arrayHelpers, fieldOptions, expressionWidth)}
        <EuiSpacer size="xs" />

        {values.groupBy.length < 2 && (
          <EuiButtonEmpty
            size="xs"
            onClick={() => {
              values.groupByField = defaultOption ? [defaultOption] : [];
              this.setState({ addButtonTouched: true });
              arrayHelpers.push('');
            }}
            data-test-subj="addGroupByButton"
          >
            + Add group by
          </EuiButtonEmpty>
        )}

        <EuiText color="danger" size="xs">
          {errors.groupBy}
        </EuiText>
      </div>
    );
  }
}

export default connect(GroupByExpression);
