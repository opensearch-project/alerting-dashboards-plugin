/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Hint,
  XAxis,
  YAxis,
  MarkSeries,
  LineSeries,
  FlexibleXYPlot,
  RectSeries,
  VerticalBarSeries,
} from 'react-vis';

import { SIZE_RANGE, ANNOTATION_STYLES, HINT_STYLES, LINE_STYLES } from './utils/constants';
import {
  getLeftPadding,
  getYTitle,
  getXDomain,
  getYDomain,
  formatYAxisTick,
  getAnnotationData,
  getDataFromResponse,
  getMarkData,
  getAggregationTitle,
  getRectData,
  getCustomAggregationTitle,
} from './utils/helpers';
import BarSeries from 'react-vis/es/plot/series/bar-series';
import { MONITOR_TYPE } from '../../../../utils/constants';

export default class VisualGraph extends Component {
  static defaultProps = { annotation: false };

  state = { hint: null };

  onNearestX = (value) => {
    this.setState({ hint: value });
  };

  resetHint = () => {
    this.setState({ hint: null });
  };
  //TODO: Render bar graph to support group by
  renderXYPlot = (data) => {
    const { annotation, thresholdValue, values } = this.props;
    const { hint } = this.state;
    const xDomain = getXDomain(data);
    const yDomain = getYDomain(data);
    const annotations = getAnnotationData(xDomain, yDomain, thresholdValue);
    const xTitle = values.timeField;
    const yTitle = getYTitle(values);
    const leftPadding = getLeftPadding(yDomain);
    const markData = getMarkData(data);
    const rectData = getRectData(data);
    const aggregationTitle = getAggregationTitle(values);

    return (
      <div>
        <FlexibleXYPlot
          height={400}
          xType="time"
          margin={{ top: 20, right: 20, bottom: 70, left: leftPadding }}
          xDomain={xDomain}
          yDomain={yDomain}
          onMouseLeave={this.resetHint}
        >
          <XAxis title={xTitle} />
          <XAxis
            title={aggregationTitle}
            position="middle"
            orientation="top"
            tickTotal={0}
            top={-25}
            style={{ strokeWidth: '0px' }}
          />
          <YAxis title={yTitle} tickFormat={formatYAxisTick} />
          {/*TODO: Convert to LineMarkSeries with individual data (e.g. "key1Data", "key2Data"*/}
          <LineSeries data={data} style={LINE_STYLES} />
          <MarkSeries data={markData} sizeRange={SIZE_RANGE} onNearestX={this.onNearestX} />
          {/*TODO: Add each group by data with a bar series graph using different colors*/}
          {/*<VerticalBarSeries data={rectData} />*/}
          {annotation && <LineSeries data={annotations} style={ANNOTATION_STYLES} />}
          {hint && (
            <Hint value={hint}>
              <div style={HINT_STYLES}>({hint.y.toLocaleString()})</div>
            </Hint>
          )}
        </FlexibleXYPlot>
        {/*<FlexibleXYPlot*/}
        {/*  height={400}*/}
        {/*  xType="time"*/}
        {/*  margin={{ top: 20, right: 20, bottom: 70, left: leftPadding }}*/}
        {/*  xDomain={xDomain}*/}
        {/*  yDomain={yDomain}*/}
        {/*  onMouseLeave={this.resetHint}*/}
        {/*></FlexibleXYPlot>*/}
      </div>
    );
  };

  renderAggregationXYPlot = (data) => {
    const { annotation, thresholdValue, values, fieldName, aggregationType } = this.props;
    const { hint } = this.state;
    const xDomain = getXDomain(data);
    const yDomain = getYDomain(data);
    const annotations = getAnnotationData(xDomain, yDomain, thresholdValue);
    const xTitle = values.timeField;
    const yTitle = getYTitle(values);
    const leftPadding = getLeftPadding(yDomain);
    const markData = getMarkData(data);
    const rectData = getRectData(data);
    const aggregationTitle = getCustomAggregationTitle(values, fieldName, aggregationType);
    // Debug use console.log('Printing out markData: ' + JSON.stringify(markData));
    console.log('Printing out data: ' + JSON.stringify(data));
    return (
      <div>
        <FlexibleXYPlot
          height={400}
          xType="time"
          margin={{ top: 20, right: 20, bottom: 70, left: leftPadding }}
          xDomain={xDomain}
          yDomain={yDomain}
          onMouseLeave={this.resetHint}
        >
          <XAxis title={xTitle} />
          <XAxis
            title={aggregationTitle}
            position="middle"
            orientation="top"
            tickTotal={0}
            top={-25}
            style={{ strokeWidth: '0px' }}
          />
          <YAxis title={yTitle} tickFormat={formatYAxisTick} />
          {/*TODO: Convert to LineMarkSeries with individual data (e.g. "key1Data", "key2Data"*/}
          <LineSeries data={data} style={LINE_STYLES} />
          <MarkSeries data={markData} sizeRange={SIZE_RANGE} onNearestX={this.onNearestX} />
          {/*TODO: Add each group by data with a bar series graph using different colors*/}
          {/*<VerticalBarSeries data={rectData} />*/}
          {annotation && <LineSeries data={annotations} style={ANNOTATION_STYLES} />}
          {hint && (
            <Hint value={hint}>
              <div style={HINT_STYLES}>({hint.y.toLocaleString()})</div>
            </Hint>
          )}
        </FlexibleXYPlot>
        {/*<FlexibleXYPlot*/}
        {/*  height={400}*/}
        {/*  xType="time"*/}
        {/*  margin={{ top: 20, right: 20, bottom: 70, left: leftPadding }}*/}
        {/*  xDomain={xDomain}*/}
        {/*  yDomain={yDomain}*/}
        {/*  onMouseLeave={this.resetHint}*/}
        {/*></FlexibleXYPlot>*/}
      </div>
    );
  };

  renderEmptyData = () => (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '450px' }}
    >
      <div>There is no data for the current selections.</div>
    </div>
  );

  render() {
    const { response, fieldName, values, aggregationType } = this.props;
    const monitorType = values.monitor_type;
    const isTraditionalMonitor = monitorType === MONITOR_TYPE.TRADITIONAL;
    const aggTypeFieldName = `${aggregationType}_${fieldName}`;

    // Debug use
    console.log('values: ' + JSON.stringify(values));
    //TODO: Pass in the groupBy field to the following method in order to sort data
    const data = getDataFromResponse(response, aggTypeFieldName, monitorType);
    // Show empty graph view when data is empty or aggregation monitor does not have group by defined.
    const showEmpty =
      !data.length || (monitorType == MONITOR_TYPE.AGGREGATION && !values.groupBy.length);

    return (
      <div style={{ padding: '20px', border: '1px solid #D9D9D9', borderRadius: '5px' }}>
        {showEmpty
          ? this.renderEmptyData()
          : isTraditionalMonitor
          ? this.renderXYPlot(data)
          : this.renderAggregationXYPlot(data)}
      </div>
    );
  }
}

VisualGraph.propTypes = {
  response: PropTypes.object,
  annotation: PropTypes.bool.isRequired,
  thresholdValue: PropTypes.number,
  values: PropTypes.object.isRequired,
};
