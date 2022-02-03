/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiHorizontalRule, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { FlexibleWidthXYPlot, Hint, HorizontalBarSeries, XAxis } from 'react-vis';
import {
  ALERT_TIMELINE_COLORS_MAP,
  TIME_SERIES_ALERT_STATE,
} from '../../../containers/MonitorHistory/utils/constants';
import { formatTooltip, formatTooltipAlertCount } from './utils/helpers';
import DelayedLoader from '../../../../../components/DelayedLoader';
import { MONITOR_TYPE } from '../../../../../utils/constants';

class TriggersTimeSeries extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hints: {},
    };
  }

  get xDomain() {
    const { domainBounds = {} } = this.props;
    return [domainBounds.startTime, domainBounds.endTime];
  }

  handleValueMouseInOut = (triggerId, dataPoint) => {
    this.setState({
      hints: { [triggerId]: dataPoint },
    });
  };

  render() {
    const { triggersData, isLoading, triggers, monitorType } = this.props;
    const { hints } = this.state;
    const isBucketMonitor = monitorType === MONITOR_TYPE.BUCKET_LEVEL;
    return (
      <DelayedLoader isLoading={isLoading}>
        {(showLoader) => (
          <div style={{ minHeight: triggers.length * 40, opacity: showLoader ? '0.2' : '1' }}>
            <EuiFlexGroup direction="column" gutterSize="none">
              {triggers.map((currentTrigger) => (
                <EuiFlexItem key={currentTrigger.name}>
                  <EuiFlexGroup justifyContent="center" gutterSize="none" alignItems="center">
                    <EuiFlexItem
                      style={{
                        alignItems: 'center',
                        maxWidth: '10%',
                        padding: '0 10px',
                        wordBreak: 'break-all',
                      }}
                    >
                      <EuiText size="s" grow={false} textAlign="center">
                        {currentTrigger.name}
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem style={{ width: '90%' }}>
                      {triggersData[currentTrigger.id] && (
                        <FlexibleWidthXYPlot
                          height={30}
                          margin={{ left: 0, top: 25 }}
                          xDomain={this.xDomain}
                          xType="time"
                          yType="ordinal"
                          getColor={(dataPoint) =>
                            ALERT_TIMELINE_COLORS_MAP[
                              dataPoint.meta.state === TIME_SERIES_ALERT_STATE.ERROR
                                ? TIME_SERIES_ALERT_STATE.ERROR
                                : dataPoint.state
                            ]
                          }
                          getY={() => 0}
                        >
                          <HorizontalBarSeries
                            data={triggersData[currentTrigger.id]}
                            colorType="literal"
                            onValueMouseOut={() => this.handleValueMouseInOut(currentTrigger.name)}
                            onValueMouseOver={(dataPoint) =>
                              this.handleValueMouseInOut(currentTrigger.name, dataPoint)
                            }
                          />
                          {!showLoader && hints[currentTrigger.name] ? (
                            <Hint
                              align={{ vertical: 'top', horizontal: 'auto' }}
                              value={hints[currentTrigger.name]}
                              format={isBucketMonitor ? formatTooltipAlertCount : formatTooltip}
                              style={{ title: { fontWeight: 'bold' } }}
                            />
                          ) : null}
                        </FlexibleWidthXYPlot>
                      )}
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiHorizontalRule margin="xs" />
                </EuiFlexItem>
              ))}
              <EuiFlexItem>
                <EuiFlexGroup alignItems="center" style={{ paddingLeft: '10%' }}>
                  <FlexibleWidthXYPlot
                    margin={{ left: 25, right: 25 }}
                    xDomain={this.xDomain}
                    height={35}
                    xType="time"
                    dontCheckIfEmpty
                  >
                    {/*TODO:: Fix to always same number of intervals */}
                    <XAxis hideLine tickTotal={14} />
                  </FlexibleWidthXYPlot>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiHorizontalRule margin="xs" />
          </div>
        )}
      </DelayedLoader>
    );
  }
}

TriggersTimeSeries.propTypes = {
  triggersData: PropTypes.shape({
    [PropTypes.string]: PropTypes.arrayOf(
      PropTypes.shape({
        x0: PropTypes.number.isRequired,
        x: PropTypes.number.isRequired,
      })
    ),
  }).isRequired,
  domainBounds: PropTypes.object.isRequired,
  monitorType: PropTypes.string.isRequired,
};
export default TriggersTimeSeries;
