/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import {
  getXDomain,
  getYDomain,
  formatYAxisTick,
  getMarkData,
} from '../../CreateMonitor/components/VisualGraph/utils/helpers';
import ContentPanel from '../../../components/ContentPanel';
import { FlexibleXYPlot, Hint, LineSeries, MarkSeries, XAxis, YAxis } from 'react-vis';
import {
  HINT_STYLES,
  LINE_STYLES,
} from '../../CreateMonitor/components/VisualGraph/utils/constants';

export default class ClusterMetricLineGraph extends Component {
  constructor(props) {
    super(props);

    this.state = { hint: null };
  }

  onNearestX = (value) => {
    this.setState({ hint: value });
  };

  onValueMouseOver = (data, seriesName) => {
    this.setState({ hint: { seriesName, data } });
  };

  resetHint = () => {
    this.setState({ hint: null });
  };

  renderXYPlot = (data, type) => {
    const xDomain = getXDomain(data);
    const yDomain = getYDomain(data);
    const markData = getMarkData(data);
    const { hint } = this.state;
    const xTitle = 'Time';

    return (
      <ContentPanel title={type} titleSize="s" panelStyles={{ paddingLeft: '10px' }}>
        <FlexibleXYPlot
          height={400}
          xType="time"
          margin={{ top: 20, right: 20, bottom: 70 }}
          xDomain={xDomain}
          yDomain={yDomain}
          onMouseLeave={this.resetHint}
        >
          <XAxis title={xTitle} />
          <YAxis title={type} tickFormat={formatYAxisTick} />
          <LineSeries data={data} style={LINE_STYLES} />
          <MarkSeries data={markData} sizeRange={[3, 3]} onNearestX={this.onNearestX} />
          {hint && (
            <Hint value={hint}>
              <div style={HINT_STYLES}>
                <p>Timestamp: {hint.x.toLocaleString()}</p>
                <p>Value: {hint.y.toLocaleString()} </p>
              </div>
            </Hint>
          )}
        </FlexibleXYPlot>
      </ContentPanel>
    );
  };
  render() {
    const { data, type } = this.props;
    return <>{this.renderXYPlot(data, type)}</>;
  }
}
