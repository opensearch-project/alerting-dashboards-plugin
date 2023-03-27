/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { EuiSpacer } from '@elastic/eui';
import { connect } from 'formik';
import { ForExpression, WhereExpression } from './expressions';
import MetricExpression from './expressions/MetricExpression';
import { FieldArray } from 'formik';
import GroupByExpression from './expressions/GroupByExpression';
import MinimalAccordion from '../../../../components/FeatureAnywhereContextMenu/MinimalAccordion';
import {
  UNITS_OF_TIME,
  MAX_NUM_QUERY_LEVEL_GROUP_BYS,
  MAX_NUM_BUCKET_LEVEL_GROUP_BYS,
  MAX_NUM_WHERE_EXPRESSION,
} from './expressions/utils/constants';
import { getIsDataFilterActive } from './expressions/utils/whereHelpers';
import { MONITOR_TYPE } from '../../../../utils/constants';

export const DEFAULT_CLOSED_STATES = {
  WHERE: false,
  // not using
  METRICS: false,
  GROUP_BY: false,
  OVER: false,
  FOR_THE_LAST: false,
  THRESHOLD: false,
  WHEN: false,
  OF_FIELD: false,
};

class MonitorExpressions extends Component {
  state = {
    openedStates: DEFAULT_CLOSED_STATES,
    madeChanges: false,
    accordionsOpen: {},
  };

  openExpression = (expression) => {
    this.setState({
      openedStates: {
        ...DEFAULT_CLOSED_STATES,
        [expression]: true,
      },
    });
  };

  closeExpression = (expression) => {
    const { madeChanges, openedStates } = this.state;
    if (madeChanges && openedStates[expression]) {
      // if made changes and close expression that was currently open => run query
      this.setState({ madeChanges: false });
    }
    this.setState({ openedStates: { ...openedStates, [expression]: false } });
  };

  onMadeChanges = () => {
    this.setState({ madeChanges: true });
  };

  getExpressionProps = () => ({
    openedStates: this.state.openedStates,
    closeExpression: this.closeExpression,
    openExpression: this.openExpression,
    onMadeChanges: this.onMadeChanges,
  });

  onAccordionToggle = (key) => {
    const accordionsOpen = { ...this.state.accordionsOpen };
    accordionsOpen[key] = !accordionsOpen[key];
    this.setState({ accordionsOpen });
  };

  render() {
    const { accordionsOpen } = this.state;
    const { dataTypes, errors, flyoutMode, formik } = this.props;
    const unit = UNITS_OF_TIME.find(({ value }) => value === formik?.values?.bucketUnitOfTime);
    const expressionProps = this.getExpressionProps();
    const isDataFilterActive = getIsDataFilterActive({ formik, ...expressionProps });
    const isBucketLevelMonitor = formik.values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL;
    const groupBysLimit = isBucketLevelMonitor
      ? MAX_NUM_BUCKET_LEVEL_GROUP_BYS
      : MAX_NUM_QUERY_LEVEL_GROUP_BYS;

    return (
      <div>
        <MinimalAccordion
          {...{
            title: 'Metrics',
            subTitle: 'COUNT OF documents. You can add up to 1 metric.',
            id: 'metric-expression__metrics',
            isOpen: accordionsOpen.metrics,
            onToggle: () => this.onAccordionToggle('metrics'),
          }}
        >
          <FieldArray name="aggregations" validateOnChange={false}>
            {(arrayHelpers) => (
              <MetricExpression
                errors={errors}
                arrayHelpers={arrayHelpers}
                dataTypes={dataTypes}
                flyoutMode={flyoutMode}
              />
            )}
          </FieldArray>
        </MinimalAccordion>
        <EuiSpacer size={flyoutMode ? 'xs' : 'm'} />
        <MinimalAccordion
          {...{
            title: 'Time range',
            subTitle: `Last ${formik.values.bucketValue} ${unit?.text}`,
            isUsingDivider: true,
            id: 'metric-expression__time-range',
            isOpen: accordionsOpen.timeRange,
            onToggle: () => this.onAccordionToggle('timeRange'),
          }}
        >
          <ForExpression />
        </MinimalAccordion>
        <EuiSpacer size={flyoutMode ? 'xs' : 'l'} />
        <MinimalAccordion
          {...{
            title: 'Data filter',
            subTitle: isDataFilterActive
              ? '1 filter defined'
              : `No filter defined. You can add up to ${MAX_NUM_WHERE_EXPRESSION} filter.`,
            isUsingDivider: true,
            id: 'metric-expression__data-filter',
            isOpen: accordionsOpen.dataFilter,
            onToggle: () => this.onAccordionToggle('dataFilter'),
          }}
        >
          <WhereExpression {...expressionProps} dataTypes={dataTypes} flyoutMode={flyoutMode} />
        </MinimalAccordion>
        <EuiSpacer size={flyoutMode ? 'xs' : 'm'} />
        <MinimalAccordion
          {...{
            title: 'Group by',
            subTitle: formik.values.groupBy.length
              ? `${formik.values.groupBy.length} groupbys defined`
              : `No group bys defined. You can add up to ${groupBysLimit} group bys.`,
            isUsingDivider: true,
            id: 'metric-expression__group-by',
            isOpen: accordionsOpen.groupBy,
            onToggle: () => this.onAccordionToggle('groupBy'),
          }}
        >
          <FieldArray name="groupBy" validateOnChange={false}>
            {(arrayHelpers) => (
              <GroupByExpression
                errors={errors}
                arrayHelpers={arrayHelpers}
                dataTypes={dataTypes}
                flyoutMode={flyoutMode}
              />
            )}
          </FieldArray>
        </MinimalAccordion>
        <EuiSpacer size="xs" />
      </div>
    );
  }
}

export default connect(MonitorExpressions);
