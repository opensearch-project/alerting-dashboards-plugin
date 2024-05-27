/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { EuiSpacer } from '@elastic/eui';
import { connect } from 'formik';
import { ForExpression, WhereExpression, WhereExpressionFlyout } from './expressions';
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
  constructor(props) {
    super(props);

    const metricAgg = props.formik.values.aggregations?.[0]
    this.state = {
      openedStates: DEFAULT_CLOSED_STATES,
      madeChanges: false,
      currentSubmitCount: 0,
      accordionsOpen: {metrics: (metricAgg?.fieldName === undefined || metricAgg?.fieldName === '')},
      SectionContainer: props.flyoutMode ? MinimalAccordion : ({ children }) => <>{children}</>,
    };
  }

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
    const newAccordionsOpen = this.state.accordionsOpen;
    newAccordionsOpen[key] = !newAccordionsOpen[key];
    this.setState({ newAccordionsOpen, currentSubmitCount: this.props.formik.submitCount });
  };

  render() {
    const { accordionsOpen, SectionContainer, currentSubmitCount } = this.state;
    const { dataTypes, errors, flyoutMode, formik } = this.props;
    const unit = UNITS_OF_TIME.find(({ value }) => value === formik?.values?.bucketUnitOfTime);
    const expressionProps = this.getExpressionProps();
    const isDataFilterActive = getIsDataFilterActive({ formik, ...expressionProps });
    const isBucketLevelMonitor = formik.values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL;
    const groupBysLimit = isBucketLevelMonitor
      ? MAX_NUM_BUCKET_LEVEL_GROUP_BYS
      : MAX_NUM_QUERY_LEVEL_GROUP_BYS;

    const metricAgg = formik.values.aggregations?.[0]
    const metricSubTitle = metricAgg ?
      `${metricAgg.aggregationType.toUpperCase()} OF ${metricAgg.fieldName}. You can add up to 1 metric.` :
      'COUNT OF documents. You can add up to 1 metric.';
    const filterFromVis = flyoutMode && flyoutMode !== 'olly';
    const whereSubTitle = filterFromVis ?
      (isDataFilterActive ?
        `1 filter defined. You can add up to ${MAX_NUM_WHERE_EXPRESSION} filter.` :
        `No filter defined. You can add up to ${MAX_NUM_WHERE_EXPRESSION} filter.`):
      `${formik.values.filters.length} filter(s) defined`

    if (flyoutMode && formik.submitCount > currentSubmitCount) {
      accordionsOpen.metrics = accordionsOpen?.metrics || 'aggregations' in errors;
      accordionsOpen.dataFilter = accordionsOpen?.dataFilter || 'where' in errors;
      accordionsOpen.groupBy = accordionsOpen?.groupBy || 'groupBy' in errors;
      accordionsOpen.timeRange = accordionsOpen?.groupBy || 'bucketValue' in errors
    }

    return (
      <div>
        <SectionContainer
          {...{
            title: 'Metrics',
            subTitle: metricSubTitle,
            isUsingDivider: flyoutMode === 'olly',
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
        </SectionContainer>
        <EuiSpacer size={flyoutMode ? 'xs' : 'm'} />
        <SectionContainer
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
        </SectionContainer>
        <EuiSpacer size={flyoutMode ? 'xs' : 'l'} />
        <SectionContainer
          {...{
            title: 'Data filter',
            subTitle: whereSubTitle,
            isUsingDivider: true,
            id: 'metric-expression__data-filter',
            isOpen: accordionsOpen.dataFilter,
            onToggle: () => this.onAccordionToggle('dataFilter'),
          }}
        >
          {
            filterFromVis ?
            <WhereExpressionFlyout {...expressionProps} dataTypes={dataTypes} flyoutMode={flyoutMode} /> :
            <WhereExpression {...expressionProps} dataTypes={dataTypes} flyoutMode={flyoutMode} />
          }
        </SectionContainer>
        <EuiSpacer size={flyoutMode ? 'xs' : 'm'} />
        <SectionContainer
          {...{
            title: 'Group by',
            subTitle: formik.values.groupBy.length > 0 && formik.values.groupBy[0] !== ''
              ? `${formik.values.groupBy.length} group bys defined. You can add up to ${groupBysLimit} group bys.`
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
        </SectionContainer>
        <EuiSpacer size="xs" />
      </div>
    );
  }
}

export default connect(MonitorExpressions);
