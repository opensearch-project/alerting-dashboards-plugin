/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Chart, Axis, LineSeries, RectAnnotation, niceTimeFormatter } from '@elastic/charts';
import { EuiPagination, EuiText, EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import DelayedLoader from '../../../../../components/DelayedLoader';
import { ChartContainer } from '../../../../../components/ChartContainer/ChartContainer';

class FeatureChart extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activePage: 0,
    };
    this.goToPage = this.goToPage.bind(this);
  }
  goToPage(pageNumber) {
    this.setState({
      activePage: pageNumber,
    });
  }
  render() {
    const { isLoading, startDateTime, endDateTime, featureData, annotations, title } = this.props;
    const currentFeature = featureData[this.state.activePage];
    const timeFormatter = niceTimeFormatter([startDateTime, endDateTime]);
    return (
      <DelayedLoader isLoading={isLoading}>
        {(showLoader) => {
          return currentFeature ? (
            <React.Fragment>
              <EuiFlexGroup justifyContent="spaceBetween">
                <EuiFlexItem grow={false}>
                  <EuiText size="xs">
                    <strong>{title}</strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiSpacer size="s" />
                <EuiFlexItem grow={false}>
                  <EuiPagination
                    pageCount={featureData.length}
                    activePage={this.state.activePage}
                    onPageClick={this.goToPage}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <ChartContainer style={showLoader ? { opacity: 0.2 } : {}}>
                <Chart>
                  <RectAnnotation
                    dataValues={annotations || []}
                    annotationId="react"
                    style={{
                      stroke: '#FCAAAA',
                      strokeWidth: 1.5,
                      fill: '#FCAAAA',
                    }}
                  />
                  <Axis id="left" title={currentFeature.featureName} position="left" />
                  <Axis id="bottom" position="bottom" tickFormat={timeFormatter} />
                  <LineSeries
                    id="lines"
                    xScaleType="time"
                    yScaleType="linear"
                    xAccessor={'startTime'}
                    yAccessors={['data']}
                    data={currentFeature.data}
                  />
                </Chart>
              </ChartContainer>
            </React.Fragment>
          ) : null;
        }}
      </DelayedLoader>
    );
  }
}

FeatureChart.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  startDateTime: PropTypes.number.isRequired,
  endDateTime: PropTypes.number.isRequired,
  featureData: PropTypes.array.isRequired,
  annotations: PropTypes.array,
  title: PropTypes.string,
};

FeatureChart.defaultProps = {
  title: 'Sample feature data',
};

export { FeatureChart };
