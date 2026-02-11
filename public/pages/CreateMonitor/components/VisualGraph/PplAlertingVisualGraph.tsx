/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useCallback } from 'react';
import {
  AnnotationDomainType,
  Axis,
  Chart,
  HistogramBarSeries,
  LineAnnotation,
  Position,
  ScaleType,
  Settings,
  TooltipType,
} from '@elastic/charts';
import { EuiFlexGroup, EuiFlexItem, EuiText} from '@elastic/eui';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import moment from 'moment-timezone';
import './PplAlertingVisualGraph.scss';

interface ChartDataPoint {
  x: number;
  y: number;
}

interface ChartData {
  values: ChartDataPoint[];
  xAxisOrderedValues: number[];
  xAxisFormat: {
    id: string;
    params: { pattern: string };
  };
  xAxisLabel: string;
  yAxisLabel?: string;
  ordered: {
    date: boolean;
    interval: any;
    intervalOpenSearchUnit: string;
    intervalOpenSearchValue: number;
    min: any;
    max: any;
  };
}

interface PplAlertingVisualGraphProps {
  response: any;
  thresholdValue?: number;
  values: any;
  services: any;
  onMaxYValueCalculated?: (maxY: number) => void;
}

const processPPLResponseToChartData = (response: any): ChartData | null => {
  
  if (!response || !response.aggregations) {
    return null;
  }

  const buckets =
    response.aggregations.ppl_histogram?.buckets ||
    response.aggregations.count_over_time?.buckets ||
    response.aggregations.date_histogram?.buckets ||
    response.aggregations.combined_value?.buckets ||
    [];

  if (!Array.isArray(buckets) || buckets.length === 0) {
    return null;
  }

  // Convert buckets to chart values
  const values = buckets
    .map((bucket: any, index: number) => {
      const timestamp = bucket.key_as_string || bucket.keyAsString || bucket.key || bucket.span || bucket.window || bucket.bucket;
      const count = Number(
        bucket.doc_count ?? 
        bucket.count ?? 
        bucket['count()'] ?? 
        bucket.total ?? 
        bucket.value ?? 
        0
      ) || 0;

      // Convert timestamp to number
      let x: number;
      if (timestamp instanceof Date) {
        x = timestamp.getTime();
      } else if (typeof timestamp === 'number') {
        x = timestamp;
      } else {
        const parsedDate = new Date(String(timestamp));
        x = parsedDate.getTime();
      }

      // Only include valid timestamps and counts
      // Allow count to be 0 (empty buckets) but require valid timestamp
      if (Number.isFinite(x) && Number.isFinite(count) && x > 0) {
        return { x, y: count };
      }
      
      return null;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.x - b.x);

  if (values.length === 0) {
    return null;
  }

  // Calculate time bounds and interval - match Discover's behavior
  const HOUR_MS = 60 * 60 * 1000;
  const FIVE_MIN_MS = 5 * 60 * 1000;
  const now = Date.now();
  let minTime = values[0]?.x;
  let maxTime = values[values.length - 1]?.x;
  
  // Calculate interval from buckets (like Discover does)
  let intervalMs = FIVE_MIN_MS; // Default to 5 minutes
  if (values.length > 1) {
    // Calculate interval from consecutive buckets
    const intervals = [];
    for (let i = 1; i < values.length; i++) {
      const diff = values[i].x - values[i - 1].x;
      if (diff > 0) {
        intervals.push(diff);
      }
    }
    if (intervals.length > 0) {
      // Use the most common interval or median
      intervals.sort((a, b) => a - b);
      intervalMs = intervals[Math.floor(intervals.length / 2)];
    }
  }
  
  // Ensure we have proper time bounds for 1-hour window
  if (values.length === 1 || (maxTime - minTime) < HOUR_MS) {
    // Use 1-hour window: from (bucket time or now - 1 hour) to now
    minTime = Math.min(minTime, now - HOUR_MS);
    maxTime = Math.max(maxTime, now);
  }
  
  // Round minTime down to nearest interval boundary for cleaner display
  minTime = Math.floor(minTime / intervalMs) * intervalMs;
  
  // Create interval duration
  const interval = moment.duration(intervalMs);
  
  // Determine interval unit for display
  let intervalUnit = 'ms';
  let intervalValue = intervalMs;
  if (intervalMs >= HOUR_MS) {
    intervalUnit = 'h';
    intervalValue = intervalMs / HOUR_MS;
  } else if (intervalMs >= 60 * 1000) {
    intervalUnit = 'm';
    intervalValue = intervalMs / (60 * 1000);
  } else if (intervalMs >= 1000) {
    intervalUnit = 's';
    intervalValue = intervalMs / 1000;
  }
  
  // Create chart data structure similar to Discover
  const chartData: ChartData = {
    values,
    xAxisOrderedValues: values.map(v => v.x),
    xAxisFormat: {
      id: 'date',
      params: { pattern: 'YYYY-MM-DD HH:mm' }
    },
    xAxisLabel: 'Time',
    yAxisLabel: 'Count',
    ordered: {
      date: true,
      interval,
      intervalOpenSearchUnit: intervalUnit,
      intervalOpenSearchValue: intervalValue,
      min: moment(minTime),
      max: moment(maxTime),
    }
  };

  return chartData;
};

export const PplAlertingVisualGraph: React.FC<PplAlertingVisualGraphProps> = ({
  response,
  thresholdValue,
  values,
  services,
  onMaxYValueCalculated,
}) => {
  const chartData = useMemo(() => {
    return processPPLResponseToChartData(response);
  }, [response]);

  const timefilterUpdateHandler = useCallback((ranges: { from: number; to: number }) => {
  }, []);

  const dataToUse = chartData?.values ?? [];

  // Validate and clean data - memoize to avoid recalculation
  const data = useMemo(() => dataToUse.filter(item => 
    item && 
    typeof item.x === 'number' && 
    typeof item.y === 'number' && 
    !isNaN(item.x) && 
    !isNaN(item.y) &&
    isFinite(item.x) &&
    isFinite(item.y)
  ), [dataToUse]);

  // Calculate domains - memoize with thresholdValue as dependency
  // Use default domain if no data to show blank graph
  const { xDomain, yDomain, dataMax } = useMemo(() => {
    // Ensure we have valid x values
    const xValues = data.map(d => d.x).filter(x => x != null && !isNaN(x));
    
    // Calculate X domain using chartData.ordered bounds like Discover does
    // This ensures proper time range covering all buckets in the 1-hour window
    const domain = chartData?.ordered;
    const domainStart = domain?.min?.valueOf();
    const domainEnd = domain?.max?.valueOf();
    const xInterval = domain?.interval?.asMilliseconds() || 5 * 60 * 1000; // Default 5 minutes
    
    // Use Discover's logic: domainStart/domainEnd from ordered bounds
    // This ensures we show the full 1-hour window even if some buckets are empty
    const firstDataX = data[0]?.x;
    const lastDataX = data[data.length - 1]?.x;
    
    // For proper display, use the ordered bounds but ensure we include all data points
    let domainMin = domainStart || firstDataX;
    let domainMax = domainEnd || lastDataX;
    
    // Ensure data points are within the domain
    if (firstDataX && firstDataX < domainMin) {
      domainMin = firstDataX;
    }
    if (lastDataX && lastDataX > domainMax) {
      domainMax = lastDataX;
    }
    
    // Extend domain to show full interval range (like Discover does)
    // This ensures empty buckets at the edges are visible
    if (domainStart && domainEnd) {
      domainMin = Math.min(domainMin || domainStart, domainStart);
      domainMax = Math.max(domainMax || domainEnd, domainEnd);
    }
    
    // If no data, use default 1-hour window
    if (!domainMin || !domainMax || !isFinite(domainMin) || !isFinite(domainMax)) {
      const now = Date.now();
      domainMin = now - 60 * 60 * 1000; // 1 hour ago
      domainMax = now;
    }
    
    const xDom = {
      min: domainMin,
      max: domainMax,
    };

    // Calculate Y domain - use threshold value to set Y-axis scale
    const yValues = data.map(d => d.y).filter(y => y != null && !isNaN(y));
    const dMax = Math.max(...yValues, 0);
    
    const thresholdNumeric =
      typeof thresholdValue === 'number' && !isNaN(thresholdValue) && thresholdValue > 0
        ? thresholdValue
        : 0;

    let yMax = Math.max(dMax, thresholdNumeric);
    const padding = Math.max(1, Math.ceil(yMax * 0.1));
    yMax = Math.max(yMax + padding, 1);

    const yDom = {
      min: 0,
      max: yMax,
    };

    return { xDomain: xDom, yDomain: yDom, dataMax: dMax };
  }, [data, thresholdValue, chartData]);
  const yTickValues = useMemo(() => {
    const max = yDomain?.max ?? 0;
    if (!max || max <= 0) return [];
    const steps = 4;
    const step = max / steps;
    return Array.from({ length: steps }, (_, idx) => Math.round((idx + 1) * step));
  }, [yDomain?.max]);

  // Notify parent of the max Y value from data (for setting default threshold)
  React.useEffect(() => {
    if (onMaxYValueCalculated && dataMax > 0) {
      onMaxYValueCalculated(Math.ceil(dataMax));
    }
  }, [dataMax, onMaxYValueCalculated]);


  // Create threshold line annotation if threshold value is provided
  const hasThreshold =
    typeof thresholdValue === 'number' && !isNaN(thresholdValue);

  const lineAnnotationData = hasThreshold
    ? [
        {
          dataValue: thresholdValue,
          details: `Threshold: ${thresholdValue.toLocaleString()}`,
        },
      ]
    : [];

  // Show blank graph instead of error messages
  // Create default empty data and domain for blank graph display
  const emptyData: ChartDataPoint[] = [];
  const defaultXDomain = {
    min: Date.now() - 60 * 60 * 1000, // 1 hour ago
    max: Date.now(),
  };
  
  const displayData = data.length === 0 ? emptyData : data;
  const displayXDomain = (!xDomain || !isFinite(xDomain.min) || !isFinite(xDomain.max)) 
    ? defaultXDomain 
    : xDomain;

  const lineAnnotationStyle = {
    line: {
      stroke: euiThemeVars.euiColorDanger,
      strokeWidth: 2,
      opacity: 0.8,
      dash: [5, 5],
    },
  };

  // Format functions like Discover
  const formatXValue = (val: string | number) => {
    if (typeof val === 'number') {
      return moment(val).format('HH:mm:ss');
    }
    return moment(val).format('HH:mm:ss');
  };

  const formatYValue = (value: number) => {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) return '\u00A0';
    return value.toLocaleString();
  };

  // Minimal theme to avoid axis errors
  const chartsTheme = {
    background: { color: 'transparent' },
  };

  return (
    <EuiFlexGroup
      direction="column"
      gutterSize="none"
      className="alertingChart__wrapper alertingChart__wrapper--enhancement"
      data-test-subj="alertingChartWrapper"
    >
      <EuiFlexItem grow={false}>
        <section
          aria-label="Histogram of found documents"
          className="alertingTimechart"
          data-test-subj="alertingTimechart"
        >
          <div className="alertingHistogram" data-test-subj="alertingChart" style={{ height: '160px' }}>
            <Chart size="100%" key={`chart-${thresholdValue}-${dataMax}`}>
              <Settings
                xDomain={displayXDomain}
                tooltip={{
                  type: TooltipType.VerticalCursor,
                }}
                theme={chartsTheme}
              />
              <Axis
                id="alerting-histogram-left-axis"
                position={Position.Left}
                title="Count"
                ticks={yTickValues.length || 5}
                tickFormat={formatYValue}
                domain={yDomain}
                tickValues={yTickValues}
              />
              <Axis
                id="alerting-histogram-bottom-axis"
                position={Position.Bottom}
                title="Time"
                ticks={10}
                tickFormat={formatXValue}
              />
              {hasThreshold && lineAnnotationData.length > 0 && (
                <LineAnnotation
                  id="threshold-line"
                  domainType={AnnotationDomainType.YDomain}
                  dataValues={lineAnnotationData}
                  hideTooltips={false}
                  style={lineAnnotationStyle}
                />
              )}
              <HistogramBarSeries
                id="alerting-histogram"
                minBarHeight={2}
                xScaleType={ScaleType.Time}
                yScaleType={ScaleType.Linear}
                xAccessor="x"
                yAccessors={['y']}
                data={displayData}
                name="Count"
              />
            </Chart>
          </div>
        </section>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export default PplAlertingVisualGraph;

