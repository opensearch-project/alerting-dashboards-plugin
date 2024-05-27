/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const initializeFromQueryParams = (queryParams) => {
  const res = {
    searchType: queryParams.searchType || undefined,
    name: queryParams.name ? `${queryParams.name}-Monitor` : undefined,
    detectorId: queryParams.adId || undefined,
    period:
      queryParams.interval && queryParams.unit
        ? { interval: parseInt(queryParams.interval), unit: queryParams.unit }
        : undefined,
    adResultIndex: queryParams.adResultIndex || undefined,

    // new prototype fields are starting as here
    index: queryParams.index ? [{ label: queryParams.index }] : undefined,
    timeField: queryParams.timeField || undefined,
    aggregationType: queryParams.aggregationType || undefined,
    aggregationField: queryParams.aggregationField || undefined,
    bucketValue: queryParams.bucketValue ||  undefined,
    bucketUnitOfTime: queryParams.bucketUnitOfTime || undefined,
    aggregations: queryParams.aggregations ?  JSON.parse(queryParams.aggregations) : undefined,
    filters: queryParams.filters ? JSON.parse(queryParams.filters) : undefined,
    triggerDefinitions: queryParams.triggers ? JSON.parse(queryParams.triggers) : undefined,
  };
  return res;
};
