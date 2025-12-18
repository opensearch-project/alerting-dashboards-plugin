/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Hint,
  XAxis,
  YAxis,
  FlexibleXYPlot,
  VerticalRectSeries,
  LineSeries,
} from 'react-vis';
import { ANNOTATION_STYLES, HINT_STYLES } from './utils/constants';
import {
  getLeftPadding,
  getYDomain,
  formatYAxisTick,
  getAnnotationData,
  getRectData,
  computeBarWidth,
  getBufferedXDomain,
} from './utils/helpers';
import ContentPanel from '../../../../components/ContentPanel';

export default class VisualGraph extends Component {
  static defaultProps = { annotation: false };

  state = { hint: null };

  // ---------- helpers (PPL-only) ----------

  getHistogramBuckets = (response) =>
    _.get(response, 'aggregations.ppl_histogram.buckets') ||
    _.get(response, 'aggregations.count_over_time.buckets') ||
    _.get(response, 'aggregations.date_histogram.buckets') ||
    _.get(response, 'aggregations.combined_value.buckets') ||
    [];

  bucketsToSeries = (buckets) => {
    if (!Array.isArray(buckets)) return [];
    return buckets
      .map((b) => {
        const ts =
          b.key_as_string ||
          b.keyAsString ||
          b.key ||
          b.span ||
          b.window ||
          b.bucket;
        const y =
          Number(
            b.doc_count ??
              b.count ??
              b['count()'] ??
              b.total ??
              b.value ??
              0
          ) || 0;

        // coerce timestamp
        const x =
          ts instanceof Date
            ? ts
            : typeof ts === 'number'
            ? new Date(ts)
            : new Date(String(ts));

        return Number.isFinite(x.getTime()) ? { x, y } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.x - b.x);
  };

  resetHint = () => this.setState({ hint: null });

  // ---------- renderers ----------

  renderBars = (data) => {
    const { annotation, thresholdValue, values } = this.props;
    const { hint } = this.state;

    const xDomain = getBufferedXDomain(data, values);
    const yDomain = getYDomain(data);
    const annotations = getAnnotationData(xDomain, yDomain, thresholdValue);
    const leftPadding = getLeftPadding(yDomain);

    // reasonable defaults for PPL-only graph
    const xTitle = values?.timeField || 'Time';
    const yTitle = '';

    // width for single-series bars
    let width = computeBarWidth(xDomain);
    if (!Number.isFinite(width) || width <= 0) {
      // fallback: ~1 hour in ms
      width = 60 * 60 * 1000;
    }
    const rectData = getRectData(data, width, 0, 1);

    return (
      <ContentPanel
        title="Results"
        titleSize="s"
        panelStyles={{ paddingLeft: '10px' }}
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
          <VerticalRectSeries
            data={rectData}
            onValueMouseOver={(d) => this.setState({ hint: d })}
          />
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

  renderEmpty = () => (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '450px' }}
    >
      <div>There is no data for the current selections.</div>
    </div>
  );

  // ---------- main ----------

  render() {
    const { response } = this.props;

    // PPL-only: read buckets and render bars
    const buckets = this.getHistogramBuckets(response);
    const data = this.bucketsToSeries(buckets);

    if (!data.length) return this.renderEmpty();
    return this.renderBars(data);
  }
}

VisualGraph.propTypes = {
  response: PropTypes.object,       // expects aggregations.*.buckets
  annotation: PropTypes.bool.isRequired,
  thresholdValue: PropTypes.number,  // draws horizontal annotation line if provided
  values: PropTypes.object.isRequired, // monitorValues; only lightly used (x-axis title, padding)
};
