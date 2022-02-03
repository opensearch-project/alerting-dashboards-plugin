/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function selectOptionValueToText(optionValue, options) {
  return options.find((opt) => opt.value === optionValue).text;
}

export function getOfExpressionAllowedTypes(values) {
  const types = ['number'];
  if (['min', 'max'].includes(values.aggregationType)) types.push('date');
  return types;
}

export function getMetricExpressionAllowedTypes(values) {
  const types = ['number'];

  // Check if the aggregation types includes any of 'min', 'max', or 'count'.
  // If so, add 'date' to the allowed type for metric expression field.
  if (
    values.aggregations.some((e) => {
      return ['min', 'max', 'count'].includes(e.aggregationType);
    })
  )
    types.push('date');

  // Check if the aggregations types includes 'count'.
  // If so, add 'keyword' to the allowed type for metric expression field.
  if (
    values.aggregations.some((e) => {
      return ['count'].includes(e.aggregationType);
    })
  )
    types.push('keyword');
  return types;
}

export function getGroupByExpressionAllowedTypes() {
  return ['keyword'];
}

export const validateAggregationsDuplicates = (aggregations) => {
  let duplicates = 0;
  aggregations.forEach((e1, index) => {
    aggregations.slice(index + 1).forEach((e2) => {
      if (e1.aggregationType === e2.aggregationType && e1.fieldName === e2.fieldName) {
        duplicates++;
      }
    });
  });
  return duplicates > 0;
};
