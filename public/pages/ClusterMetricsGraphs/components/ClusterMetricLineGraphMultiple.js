/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import {
  getXDomain,
  formatYAxisTick,
  getMarkData,
} from '../../CreateMonitor/components/VisualGraph/utils/helpers';
import ContentPanel from '../../../components/ContentPanel';
import {
  FlexibleXYPlot,
  Hint,
  LineSeries,
  MarkSeries,
  XAxis,
  YAxis,
  ChartLabel,
  DiscreteColorLegend,
} from 'react-vis';
import {
  HINT_STYLES,
  LINE_STYLES,
  Y_DOMAIN_BUFFER,
} from '../../CreateMonitor/components/VisualGraph/utils/constants';

export default class ClusterMetricLineGraphMultiple extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hint: null,
      hintMin: null,
      hintMax: null,
    };
  }

  onNearestX = (value) => {
    this.setState({ hint: value });
  };

  onNearestXMin = (value) => {
    this.setState({ hintMin: value });
  };

  onNearestXMax = (value) => {
    this.setState({ hintMax: value });
  };

  onValueMouseOver = (data, seriesName) => {
    this.setState({ hint: { seriesName, data } });
  };

  resetHint = () => {
    this.setState({ hint: null, hintMin: null, hintMax: null });
  };

  getYDomain(dataMin, dataMax) {
    const max = dataMax.reduce((accu, { y }) => Math.max(accu, y), 0);
    const min = dataMin.reduce((accu, { y }) => Math.min(accu, y), 0);
    if (max === min) return [0, 10];
    const maxBuffer = Math.ceil(max * Y_DOMAIN_BUFFER);
    const minBuffer = Math.floor(min * Y_DOMAIN_BUFFER);
    return [minBuffer, maxBuffer];
  }

  renderXYPlot = (data, dataMin, dataMax, type) => {
    const xDomain = getXDomain(data);
    const yDomain = this.getYDomain(dataMin, dataMax);
    const markData = getMarkData(data);
    const markDataMax = getMarkData(dataMax);
    const markDataMin = getMarkData(dataMin);
    const dataPlot = [[dataMin], [data], [dataMax]];
    const legendItems = [
      {
        title: 'Average',
        color: 'blue',
      },
      {
        title: 'Minimum',
        color: 'orange',
      },
      {
        title: 'Maximum',
        color: 'green',
      },
    ];

    const { hint, hintMin, hintMax } = this.state;
    const xTitle = 'Time';

    return (
      <ContentPanel title={type} titleSize="s" panelStyles={{ paddingLeft: '10px' }}>
        <FlexibleXYPlot
          height={410}
          xType="time"
          margin={{ top: 20, right: 20, bottom: 70 }}
          xDomain={xDomain}
          yDomain={yDomain}
          onMouseLeave={this.resetHint}
        >
          <XAxis />
          <ChartLabel text={xTitle} xPercent={0.965} yPercent={0.85} />
          <YAxis title={type} tickFormat={formatYAxisTick} />
          <DiscreteColorLegend
            items={legendItems}
            orientation={'horizontal'}
            style={{ position: 'absolute', left: '20px', bottom: '5px' }}
          />
          <LineSeries data={data} style={LINE_STYLES} color={'blue'} />
          <MarkSeries data={markData} sizeRange={[3, 3]} onNearestX={this.onNearestX} />
          <LineSeries data={dataMin} style={LINE_STYLES} color={'orange'} />
          <MarkSeries data={markDataMin} sizeRange={[3, 3]} onNearestX={this.onNearestXMin} />
          <LineSeries data={dataMax} style={LINE_STYLES} color={'green'} />
          <MarkSeries data={markDataMax} sizeRange={[3, 3]} onNearestX={this.onNearestXMax} />
          {hint && (
            <Hint value={hint}>
              <div style={HINT_STYLES}>
                <p>Timestamp: {hint.x.toLocaleString()}</p>
                <p>Maximum: {hintMax.y.toLocaleString()}</p>
                <p>Average: {hint.y.toLocaleString()}</p>
                <p>Minimum: {hintMin.y.toLocaleString()}</p>
              </div>
            </Hint>
          )}
        </FlexibleXYPlot>
      </ContentPanel>
    );
  };
  render() {
    const { data, dataMin, dataMax, type } = this.props;
    return <>{this.renderXYPlot(data, dataMin, dataMax, type)}</>;
  }
}
