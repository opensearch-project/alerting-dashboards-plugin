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
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import moment from 'moment-timezone';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';
import './AlertingVisualGraph.scss';

interface AlertingVisualGraphProps {
  response: any;
  thresholdValue?: number;
  values: any;
  services: any;
  onMaxYValueCalculated?: (maxY: number) => void;
}

interface ChartData {
  values: Array<{
    x: number;
    y: number;
  }>;
  xAxisOrderedValues: number[];
  xAxisFormat: any;
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

/**
 * Process PPL response to create chart data similar to Discover's histogram
 */
const processPPLResponseToChartData = (response: any): ChartData | null => {
  if (!response || !response.aggregations) {
    return null;
  }

  // Extract histogram buckets from various possible aggregation structures
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
    .map((bucket: any) => {
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

  // Create chart data structure similar to Discover
  const chartData: ChartData = {
    values,
    xAxisOrderedValues: values.map(v => v.x),
    xAxisFormat: {
      id: 'date',
      params: { pattern: 'YYYY-MM-DD HH:mm:ss' }
    },
    xAxisLabel: 'Time',
    yAxisLabel: 'Count',
    ordered: {
      date: true,
      interval: moment.duration(1, 'hour'), // Default interval
      intervalOpenSearchUnit: 'h',
      intervalOpenSearchValue: 1,
      min: moment(values[0]?.x),
      max: moment(values[values.length - 1]?.x),
    }
  };

  return chartData;
};

export const AlertingVisualGraph: React.FC<AlertingVisualGraphProps> = ({
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
    // Handle time filter updates if needed
    console.log('Time filter update:', ranges);
  }, []);

  const dataToUse = chartData?.values ?? [];
  const hasRealData = dataToUse.length > 0;

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
  const { xDomain, yDomain, dataMax } = useMemo(() => {
    // Ensure we have valid x values
    const xValues = data.map(d => d.x).filter(x => x != null && !isNaN(x));
    
    // Calculate X domain (time values)
    const xDom = {
      min: Math.min(...xValues),
      max: Math.max(...xValues),
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
  }, [data, thresholdValue]);

  const yTickValues = useMemo(() => {
    const max = yDomain?.max ?? 0;
    if (!max || max <= 0) return [];
    const steps = 4;
    const step = max / steps;
    return Array.from({ length: steps }, (_, idx) => Math.round((idx + 1) * step));
  }, [yDomain.max]);

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

  if (data.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
        <EuiText>No valid data points found.</EuiText>
      </div>
    );
  }

  if (!xDomain || !isFinite(xDomain.min) || !isFinite(xDomain.max)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
        <EuiText>No valid time data found.</EuiText>
      </div>
    );
  }

  const lineAnnotationStyle = {
    line: {
      stroke: '#e74c3c',
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
    if (typeof value !== 'number' || isNaN(value)) return '\u00A0';
    if (value <= 0) return '\u00A0';
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
        <EuiText size="s" style={{ padding: '10px' }}>
          <strong>Results{!hasRealData ? ' (Sample Data)' : ''}</strong>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <section
          aria-label="Histogram of found documents"
          className="alertingTimechart"
          data-test-subj="alertingTimechart"
        >
          <div className="alertingHistogram" data-test-subj="alertingChart" style={{ height: '160px' }}>
            <Chart size="100%" key={`chart-${thresholdValue}-${dataMax}`}>
              <Settings
                xDomain={xDomain}
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
                data={data}
                name="Count"
              />
            </Chart>
          </div>
        </section>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
