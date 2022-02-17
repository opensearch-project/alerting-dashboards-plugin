/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const getRandomInt = () => Math.floor(Math.random() * 10) + 1;

export const generatePOIData = (startTime) =>
  Array(96) // 2 Days duration with 30 mins interval
    .fill(0)
    .map((item) => ({
      key: startTime.add(30, 'm').valueOf(),
      doc_count: getRandomInt(),
    }));

export const getPOIResponse = (initialStartTime) => {
  const histogramBucketsData = generatePOIData(initialStartTime);
  return {
    ok: true,
    resp: {
      aggregations: {
        alerts_over_time: { buckets: histogramBucketsData },
        max_alerts: {
          value: Math.max(...histogramBucketsData.map((datapoint) => datapoint.doc_count)),
        },
      },
    },
  };
};

export const getAlertsResponse = (
  triggerId,
  triggerName,
  monitorId,
  monitorName,
  windowStartTime
) => {
  const initialStartTime = windowStartTime;
  return {
    trigger_id: triggerId,
    trigger_name: triggerName,
    monitor_id: monitorId,
    monitor_name: monitorName,
    start_time: initialStartTime.add(5, 'm').valueOf(),
    end_time: initialStartTime.add(3, 'm').valueOf(),
    state: 'COMPLETED',
  };
};
