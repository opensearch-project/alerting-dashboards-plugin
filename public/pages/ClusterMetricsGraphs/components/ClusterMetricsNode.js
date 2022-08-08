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

export default class ClusterMetricsNode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hint: null,
      hint2: null,
    };
  }

  onNearestX = (value) => {
    this.setState({ hint: value });
  };

  onNearestX2 = (value) => {
    this.setState({ hint2: value });
  };

  onValueMouseOver = (data, seriesName) => {
    this.setState({ hint: { seriesName, data } });
  };

  resetHint = () => {
    this.setState({ hint: null, hintMin: null, hintMax: null });
  };

  getYDomain(data, data2) {
    const maxData = data.reduce((accu, { y }) => Math.max(accu, y), 0);
    const maxData2 = data2.reduce((accu, { y }) => Math.max(accu, y), 0);
    const max = Math.max(maxData, maxData2);

    const minData = data.reduce((accu, { y }) => Math.min(accu, y), 0);
    const minData2 = data2.reduce((accu, { y }) => Math.max(accu, y), 0);
    const min = Math.min(minData, minData2);

    if (max === min) return [0, 10];
    const maxBuffer = Math.ceil(max * Y_DOMAIN_BUFFER);
    const minBuffer = Math.floor(min * Y_DOMAIN_BUFFER);
    return [minBuffer, maxBuffer];
  }

  renderXYPlot = (data, data2, type) => {
    const xDomain = getXDomain(data);
    const yDomain = this.getYDomain(data, data2);
    const markData = getMarkData(data);
    const markData2 = getMarkData(data2);
    const legendItems = [
      {
        title: 'Number Nodes',
        color: 'blue',
      },
      {
        title: 'Number Data Nodes',
        color: 'orange',
      },
    ];

    const { hint, hint2 } = this.state;

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
          <LineSeries data={data2} style={LINE_STYLES} color={'orange'} />
          <MarkSeries data={markData2} sizeRange={[3, 3]} onNearestX={this.onNearestX2} />
          {hint && (
            <Hint value={hint}>
              <div style={HINT_STYLES}>
                <p>Timestamp: {hint.x.toLocaleString()}</p>
                <p>Number of Total Nodes: {hint.y.toLocaleString()}</p>
                <p>Number of Data Nodes: {hint2.y.toLocaleString()}</p>
              </div>
            </Hint>
          )}
        </FlexibleXYPlot>
      </ContentPanel>
    );
  };
  render() {
    const { data, data2, type } = this.props;
    return <>{this.renderXYPlot(data, data2, type)}</>;
  }
}
