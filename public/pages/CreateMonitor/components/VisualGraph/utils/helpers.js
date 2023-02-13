/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import moment from 'moment';

import { selectOptionValueToText } from '../../MonitorExpressions/expressions/utils/helpers';
import {
  AGGREGATION_TYPES,
  UNITS_OF_TIME,
} from '../../MonitorExpressions/expressions/utils/constants';
import {
  Y_DOMAIN_BUFFER,
  DEFAULT_MARK_SIZE,
  X_DOMAIN_BUFFER,
  BAR_PERCENTAGE,
  BAR_KEY_COUNT,
} from './constants';
import { MONITOR_TYPE } from '../../../../../utils/constants';

export function getYTitle(values) {
  return _.get(values, `aggregations[0].fieldName`, 'doc_count');
}

export function getLeftPadding(yDomain) {
  const [min, max] = yDomain;
  const maxLength = Math.max(min.toString().length, max.toString().length);
  // These are MAGIC numbers..
  // 80 is the default left padding
  // 9 is the length when we start adding to base
  // 10 is the number we multiply to add left padding for each digit
  const multiplier = Math.max(maxLength - 9, 0);
  return 80 + multiplier * 10;
}

export function getXDomain(data) {
  const minDate = data[0];
  const maxDate = data[data.length - 1];
  return [minDate.x, maxDate.x];
}

export function getBufferedXDomain(data, values) {
  const { bucketValue, bucketUnitOfTime } = values;
  const minDate = data[0].x;
  const maxDate = data[data.length - 1].x;
  // If minDate equals to maxDate, then use bucketValue and bucketUnitOfTime as timeRange.
  let timeRange = maxDate - minDate;
  if (!timeRange) timeRange = moment.duration(bucketValue, bucketUnitOfTime);

  const minDateBuffer = minDate - timeRange * X_DOMAIN_BUFFER;
  const maxDateBuffer = maxDate.getTime() + timeRange * X_DOMAIN_BUFFER;
  return [minDateBuffer, maxDateBuffer];
}

export function getYDomain(data) {
  if (!data.length) return [0, 10];
  const max = data.reduce((accu, { y }) => Math.max(accu, y), 0);
  const min = data.reduce((accu, { y }) => Math.min(accu, y), 0);
  if (max === min) return [0, 10];
  const maxBuffer = Math.ceil(max * Y_DOMAIN_BUFFER);
  const minBuffer = Math.floor(min * Y_DOMAIN_BUFFER);
  return [minBuffer, maxBuffer];
}

export function formatYAxisTick(value) {
  return value.toLocaleString();
}

export function getAnnotationData(xDomain, yDomain, thresholdValue) {
  const [xMin, xMax] = xDomain;
  const [yMin, yMax] = yDomain;
  let yValue = thresholdValue;
  if (thresholdValue > yMax) yValue = yMax;
  if (thresholdValue < yMin) yValue = yMin;
  return [
    { x: xMin, y: yValue },
    { x: xMax, y: yValue },
  ];
}

export function getDataFromResponse(response, fieldName, monitorType) {
  if (!response) return [];
  const isQueryMonitor = monitorType === MONITOR_TYPE.QUERY_LEVEL;

  if (isQueryMonitor) {
    const buckets = _.get(response, 'aggregations.over.buckets', []);
    return buckets.map(getXYValues).filter(filterInvalidYValues);
  } else {
    const buckets = _.get(response, 'aggregations.composite_agg.buckets', []);
    return buckets
      .map((bucket) => getXYValuesByFieldName(bucket, fieldName))
      .filter(filterInvalidYValues)
      .sort((a, b) => a.x - b.x);
  }
}

// Function for aggregation type monitors to get Map of data.
// The current response gives a large number of data aggregated in buckets, and this function returns the top n results with highest count of data points.
// The number n is based on the constant BAY_KEY_COUNT.
export function getMapDataFromResponse(response, fieldName, groupByFields) {
  if (!response) return [];
  const buckets = _.get(response, 'aggregations.composite_agg.buckets', []);
  const allData = new Map();
  buckets.map((bucket) => {
    const dataPoint = getXYValuesByFieldName(bucket, fieldName);
    // Key of object is the string concat by group by field values
    const key = groupByFields.map((field) => _.get(bucket.key, field, '-')).join(', ');
    allData.has(key)
      ? allData.set(key, [dataPoint, ...allData.get(key)])
      : allData.set(key, [dataPoint]);
  });
  const entryLength = [];
  for (const [key, value] of allData.entries()) {
    allData.set(key, _.filter(value, filterInvalidYValues));
    entryLength.push({ key, length: value.length });
  }
  // Return arrays of data with more data points
  entryLength.sort((entryA, entryB) => entryB.length - entryA.length);
  const result = entryLength.slice(0, BAR_KEY_COUNT).map((entry) => {
    return { key: entry.key, data: allData.get(entry.key) };
  });
  return result;
}

export function getXYValuesByFieldName(bucket, fieldName) {
  const x = new Date(bucket.key.date);
  // Parse the fieldName containing "." to "_"
  const parsedFieldName = fieldName.replace(/\./g, '_');
  const path = bucket[parsedFieldName] ? `${parsedFieldName}.value` : 'doc_count';
  const y = _.get(bucket, path, null);
  return { x, y };
}

export function getXYValues(bucket) {
  const x = new Date(bucket.key_as_string);
  const path = bucket.metric ? 'metric.value' : 'doc_count';
  const y = _.get(bucket, path, null);
  return { x, y };
}

export function filterInvalidYValues({ y }) {
  return !isNaN(parseFloat(y));
}

export function getMarkData(data) {
  return data.map((d) => ({ ...d, size: DEFAULT_MARK_SIZE }));
}

export function getRectData(data, width = 30000, index, seriesCount) {
  // Shift x and x0 value according to total number of data series
  const midIndex = seriesCount / 2;
  const shiftAmount = (index - midIndex) * width;
  return data.map((d) => {
    const x = d.x.getTime() + shiftAmount;
    const x0 = x - width;
    return {
      x0,
      x,
      y: d.y,
      actualX: d.x,
    };
  });
}

export function computeBarWidth(xDomain) {
  const [min, max] = xDomain;
  return Math.abs(max - min) * BAR_PERCENTAGE;
}

export function getAggregationGraphHint(hint) {
  return (
    hint.seriesName +
    ': (' +
    hint.data.actualX.toLocaleString() +
    ', ' +
    hint.data.y.toLocaleString() +
    ')'
  );
}

export function getGraphDescription(bucketValue, bucketUnitOfTime, groupBy) {
  const text = `FOR THE LAST ${bucketValue} ${selectOptionValueToText(
    bucketUnitOfTime,
    UNITS_OF_TIME
  )}`;
  if (_.isEmpty(groupBy)) return text;
  return text + ` GROUP BY ${groupBy}`;
}
