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
  VerticalRectSeries,
  DiscreteColorLegend,
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
  getMapDataFromResponse,
  getRectData,
  computeBarWidth,
  getAggregationGraphHint,
  getBufferedXDomain,
  getGraphDescription,
} from './utils/helpers';
import { MONITOR_TYPE } from '../../../../utils/constants';
import ContentPanel from '../../../../components/ContentPanel';
import { selectOptionValueToText } from '../MonitorExpressions/expressions/utils/helpers';
import { UNITS_OF_TIME } from '../MonitorExpressions/expressions/utils/constants';

export default class VisualGraph extends Component {
  static defaultProps = { annotation: false };

  state = { hint: null };

  onNearestX = (value) => {
    this.setState({ hint: value });
  };

  onValueMouseOver = (data, seriesName) => {
    this.setState({ hint: { seriesName, data } });
  };

  resetHint = () => {
    this.setState({ hint: null });
  };

  renderXYPlot = (data) => {
    const { annotation, thresholdValue, values } = this.props;
    const { bucketValue, bucketUnitOfTime, groupBy, aggregations } = values;
    const aggregationType = aggregations[0]?.aggregationType;
    const fieldName = aggregations[0]?.fieldName;
    const { hint } = this.state;

    const xDomain = getXDomain(data);
    const yDomain = getYDomain(data);
    const annotations = getAnnotationData(xDomain, yDomain, thresholdValue);

    const xTitle = values.timeField;
    const yTitle = getYTitle(values);
    const leftPadding = getLeftPadding(yDomain);
    const markData = getMarkData(data);
    const title = aggregationType
      ? `${aggregationType?.toUpperCase()} OF ${fieldName}`
      : 'COUNT of documents';
    const description = getGraphDescription(bucketValue, bucketUnitOfTime, groupBy);

    return (
      <ContentPanel
        title={title}
        titleSize="s"
        panelStyles={{ paddingLeft: '10px' }}
        description={description}
      >
        <FlexibleXYPlot
          height={400}
          xType="time"
          margin={{ top: 20, right: 20, bottom: 70, left: leftPadding }}
          xDomain={xDomain}
          yDomain={yDomain}
          onMouseLeave={this.resetHint}
        >
          <XAxis title={xTitle} />
          <YAxis title={yTitle} tickFormat={formatYAxisTick} />
          <LineSeries data={data} style={LINE_STYLES} />
          <MarkSeries data={markData} sizeRange={SIZE_RANGE} onNearestX={this.onNearestX} />
          {annotation && <LineSeries data={annotations} style={ANNOTATION_STYLES} />}
          {hint && (
            <Hint value={hint}>
              <div style={HINT_STYLES}>({hint.y.toLocaleString()})</div>
            </Hint>
          )}
        </FlexibleXYPlot>
      </ContentPanel>
    );
  };

  renderAggregationXYPlot = (data, groupedData) => {
    const { annotation, thresholdValue, values, fieldName, aggregationType } = this.props;
    const { hint } = this.state;
    const xDomain = getBufferedXDomain(data, values);
    const yDomain = getYDomain(data);
    const annotations = getAnnotationData(xDomain, yDomain, thresholdValue);
    const xTitle = values.timeField;
    const yTitle = fieldName;
    const leftPadding = getLeftPadding(yDomain);
    const width = computeBarWidth(xDomain);

    const title = aggregationType
      ? `${aggregationType?.toUpperCase()} OF ${fieldName}`
      : 'COUNT of documents';
    const legends = groupedData.map((dataSeries) => dataSeries.key);

    return (
      <ContentPanel
        title={title}
        titleSize="s"
        panelStyles={{ paddingLeft: '10px' }}
        description={
          <span>
            FOR THE LAST {values.bucketValue}{' '}
            {selectOptionValueToText(values.bucketUnitOfTime, UNITS_OF_TIME)}, GROUP BY{' '}
            {`${values.groupBy}`}, Showing top 3 buckets.
          </span>
        }
      >
        <FlexibleXYPlot
          height={400}
          xType="time"
          margin={{ top: 20, right: 20, bottom: 70, left: leftPadding }}
          xDomain={xDomain}
          yDomain={yDomain}
          onMouseLeave={this.resetHint}
        >
          <XAxis title={xTitle} />
          <YAxis title={yTitle} tickFormat={formatYAxisTick} />
          <DiscreteColorLegend
            style={{ position: 'absolute', right: '50px', top: '10px' }}
            items={legends}
          />
          {groupedData.map((dataSeries, index, arr) => {
            const rectData = getRectData(dataSeries.data, width, index, arr.length);
            return (
              <VerticalRectSeries
                key={`vertical-rect-${index}`}
                className={dataSeries.key}
                data={rectData}
                onValueMouseOver={(d) => this.onValueMouseOver(d, dataSeries.key)}
              />
            );
          })}
          {annotation && <LineSeries data={annotations} style={ANNOTATION_STYLES} />}
          {hint && (
            <Hint value={hint}>
              <div style={HINT_STYLES}>{getAggregationGraphHint(hint)}</div>
            </Hint>
          )}
        </FlexibleXYPlot>
      </ContentPanel>
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
    const { values, response, fieldName, aggregationType } = this.props;
    const monitorType = values.monitor_type;
    const isQueryMonitor = monitorType === MONITOR_TYPE.QUERY_LEVEL;
    const aggTypeFieldName = `${aggregationType}_${fieldName}`;
    const data = getDataFromResponse(response, aggTypeFieldName, monitorType);
    const groupedData = isQueryMonitor
      ? null
      : getMapDataFromResponse(response, aggTypeFieldName, values.groupBy);
    // Show empty graph view when data is empty or aggregation monitor does not have group by defined.
    const showEmpty =
      !data.length || (monitorType == MONITOR_TYPE.BUCKET_LEVEL && !values.groupBy.length);

    return (
      <>
        {showEmpty
          ? this.renderEmptyData()
          : isQueryMonitor
          ? this.renderXYPlot(data)
          : this.renderAggregationXYPlot(data, groupedData)}
      </>
    );
  }
}

VisualGraph.propTypes = {
  response: PropTypes.object,
  annotation: PropTypes.bool.isRequired,
  thresholdValue: PropTypes.number,
  values: PropTypes.object.isRequired,
};
