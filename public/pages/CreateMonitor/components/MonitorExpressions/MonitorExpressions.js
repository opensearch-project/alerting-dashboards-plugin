/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { EuiSpacer } from '@elastic/eui';

import { ForExpression, WhereExpression } from './expressions';
import MetricExpression from './expressions/MetricExpression';
import { FieldArray } from 'formik';
import GroupByExpression from './expressions/GroupByExpression';

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

export default class MonitorExpressions extends Component {
  state = {
    openedStates: DEFAULT_CLOSED_STATES,
    madeChanges: false,
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

  render() {
    const { dataTypes, errors } = this.props;
    return (
      <div>
        <FieldArray name="aggregations" validateOnChange={false}>
          {(arrayHelpers) => (
            <MetricExpression errors={errors} arrayHelpers={arrayHelpers} dataTypes={dataTypes} />
          )}
        </FieldArray>
        <EuiSpacer size="m" />
        <ForExpression />
        <EuiSpacer size="l" />
        <WhereExpression {...this.getExpressionProps()} dataTypes={dataTypes} />
        <EuiSpacer size="m" />
        <FieldArray name="groupBy" validateOnChange={false}>
          {(arrayHelpers) => (
            <GroupByExpression errors={errors} arrayHelpers={arrayHelpers} dataTypes={dataTypes} />
          )}
        </FieldArray>
        <EuiSpacer size="xs" />
      </div>
    );
  }
}
