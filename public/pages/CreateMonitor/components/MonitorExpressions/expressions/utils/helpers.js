/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
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
