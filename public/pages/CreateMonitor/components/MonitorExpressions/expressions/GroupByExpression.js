/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { connect } from 'formik';
import { EuiText, EuiButtonEmpty, EuiSpacer } from '@elastic/eui';
import { getIndexFields } from './utils/dataTypes';
import { getGroupByExpressionAllowedTypes } from './utils/helpers';
import GroupByItem from './GroupByItem';
import { GROUP_BY_ERROR, QUERY_TYPE_GROUP_BY_ERROR } from './utils/constants';
import { MONITOR_TYPE } from '../../../../../utils/constants';
import { inputLimitText } from '../../../../../utils/helpers';
import {
  GROUP_BY_TOOLTIP_TEXT,
  TIME_RANGE_TOOLTIP_TEXT,
} from '../../../containers/CreateMonitor/utils/constants';
import IconToolTip from '../../../../../components/IconToolTip';

export const MAX_NUM_QUERY_LEVEL_GROUP_BYS = 1;
export const MAX_NUM_BUCKET_LEVEL_GROUP_BYS = 2;

class GroupByExpression extends Component {
  renderFieldItems = (arrayHelpers, fieldOptions, expressionWidth) => {
    const {
      formik: { values },
    } = this.props;
    return values.groupBy.map((groupByItem, index) => {
      return (
        <span style={{ paddingRight: '5px' }} key={`group-by-expr-${index}`}>
          <GroupByItem
            values={values}
            arrayHelpers={arrayHelpers}
            fieldOptions={fieldOptions}
            expressionWidth={expressionWidth}
            groupByItem={groupByItem}
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
    const { monitor_type: monitorType, groupBy } = values;

    const fieldOptions = getIndexFields(dataTypes, getGroupByExpressionAllowedTypes(values));

    const expressionWidth =
      Math.max(
        ...fieldOptions.map(({ options }) =>
          options.reduce((accu, curr) => Math.max(accu, curr.label.length), 0)
        )
      ) *
        8 +
      60;

    const isBucketLevelMonitor = values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL;
    if (!values.groupBy.length && isBucketLevelMonitor) {
      errors.groupBy = GROUP_BY_ERROR;
    } else if (!isBucketLevelMonitor && values.groupBy.length > MAX_NUM_QUERY_LEVEL_GROUP_BYS) {
      errors.groupBy = QUERY_TYPE_GROUP_BY_ERROR;
    } else {
      delete errors.groupBy;
    }

    let showAddButtonFlag = false;
    if (!isBucketLevelMonitor && groupBy.length < MAX_NUM_QUERY_LEVEL_GROUP_BYS) {
      showAddButtonFlag = true;
    } else if (isBucketLevelMonitor && groupBy.length < MAX_NUM_BUCKET_LEVEL_GROUP_BYS) {
      showAddButtonFlag = true;
    }

    const limitText = isBucketLevelMonitor
      ? inputLimitText(groupBy.length, MAX_NUM_BUCKET_LEVEL_GROUP_BYS, 'group by', 'group bys', {
          paddingLeft: '10px',
        })
      : inputLimitText(groupBy.length, MAX_NUM_QUERY_LEVEL_GROUP_BYS, 'group by', 'group bys', {
          paddingLeft: '10px',
        });

    return (
      <div id="groupBy">
        <EuiText size="xs">
          <strong>Group by </strong>
          {!isBucketLevelMonitor ? <i>- optional </i> : null}
          <IconToolTip content={GROUP_BY_TOOLTIP_TEXT} iconType="questionInCircle" />
        </EuiText>
        <EuiSpacer size={'s'} />

        {values.groupBy.length === 0 && (
          <div>
            <EuiText size={'xs'}>No group bys defined.</EuiText>
          </div>
        )}

        {this.renderFieldItems(arrayHelpers, fieldOptions, expressionWidth)}
        <EuiSpacer size="xs" />

        {showAddButtonFlag && (
          <EuiButtonEmpty
            size="xs"
            onClick={() => {
              arrayHelpers.push('');
            }}
            data-test-subj="addGroupByButton"
            style={{ paddingTop: '5px' }}
          >
            + Add group by
          </EuiButtonEmpty>
        )}

        <EuiText color="danger" size="xs">
          {errors.groupBy}
        </EuiText>

        {limitText}
      </div>
    );
  }
}

export default connect(GroupByExpression);
