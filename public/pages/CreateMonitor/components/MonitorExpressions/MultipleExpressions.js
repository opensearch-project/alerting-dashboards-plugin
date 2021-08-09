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
import { EuiSpacer } from '@elastic/eui';

import {
  ForExpression,
  OfExpression,
  WhereExpression,
} from './expressions';
import MetricExpression from './expressions/MetricExpression';

export const DEFAULT_CLOSED_STATES = {
  WHEN: false,
  OF_FIELD: false,
  THRESHOLD: false,
  OVER: false,
  FOR_THE_LAST: false,
  WHERE: false,
};

export default class MultipleExpressions extends Component {
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
      this.props.onRunQuery();
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
    const { dataTypes, ofEnabled } = this.props;
    return (
      <div>
        <MetricExpression {...this.getExpressionProps()} dataTypes={dataTypes} />
        <EuiSpacer size="xs" />
        <ForExpression {...this.getExpressionProps()} />
        <EuiSpacer size="xs" />
        <WhereExpression {...this.getExpressionProps()} dataTypes={dataTypes} />
        <EuiSpacer size="xs" />

        {/*TODO: Remove the following old version of monitor expression*/}
        <OfExpression {...this.getExpressionProps()} dataTypes={dataTypes} />
      </div>
    );
  }
}
