/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const anomalyResultMapper = (anomalyResults) => {
  let resultData = {
    anomalies: [],
    featureData: {},
  };
  if (anomalyResults.length === 0) return resultData;
  //initialize features list.
  const firstAnomaly = anomalyResults[0];
  Object.values(firstAnomaly.featureData).forEach((feature) => {
    resultData.featureData[feature.featureId] = [];
  });
  anomalyResults.forEach(({ featureData, ...rest }) => {
    resultData.anomalies.push({
      ...rest,
      anomalyGrade:
        rest.anomalyGrade != null && rest.anomalyGrade > 0
          ? Number.parseFloat(rest.anomalyGrade).toFixed(2)
          : 0,
      confidence:
        rest.confidence != null && rest.confidence > 0
          ? Number.parseFloat(rest.confidence).toFixed(2)
          : 0,
      plotTime: rest.dataStartTime + Math.floor((rest.dataEndTime - rest.dataStartTime) / 2),
    });
    featureData.forEach((feature) => {
      resultData.featureData[feature.featureId].push({
        startTime: rest.dataStartTime,
        endTime: rest.dataEndTime,
        plotTime: rest.dataStartTime + Math.floor((rest.dataEndTime - rest.dataStartTime) / 2),
        data: feature.data,
      });
    });
  });
  return resultData;
};
