/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiSpacer } from '@elastic/eui';
import { AnomalyDetectorData } from '../../../CreateMonitor/containers/AnomalyDetectors/AnomalyDetectorData';
import TriggerExpressions from '../../components/TriggerExpressions';
import { AnomaliesChart } from '../../../CreateMonitor/components/AnomalyDetectors/AnomaliesChart';
import { EmptyFeaturesMessage } from '../../../CreateMonitor/components/AnomalyDetectors/EmptyFeaturesMessage/EmptyFeaturesMessage';
import { EmptyDetectorMessage } from '../../../CreateMonitor/components/AnomalyDetectors/EmptyDetectorMessage/EmptyDetectorMessage';

class AnomalyDetectorTrigger extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { adValues, detectorId, fieldPath } = this.props;
    return (
      <div style={{ padding: '0px 10px' }}>
        <AnomalyDetectorData
          detectorId={detectorId}
          render={(anomalyData) => {
            // using lodash.get without worrying about whether an intermediate property is null or undefined.
            if (_.get(anomalyData, 'anomalyResult.anomalies', []).length > 0) {
              return (
                <React.Fragment>
                  <TriggerExpressions
                    thresholdValue={adValues.anomalyGradeThresholdValue}
                    thresholdEnum={adValues.anomalyGradeThresholdEnum}
                    keyFieldName={`${fieldPath}anomalyDetector.anomalyGradeThresholdEnum`}
                    valueFieldName={`${fieldPath}anomalyDetector.anomalyGradeThresholdValue`}
                    label="Anomaly grade threshold"
                  />
                  <EuiSpacer size="xs" />
                  <AnomaliesChart
                    showTitle={false}
                    showSettings={false}
                    startDateTime={anomalyData.previewStartTime}
                    endDateTime={anomalyData.previewEndTime}
                    anomalies={anomalyData.anomalyResult.anomalies}
                    isLoading={anomalyData.isLoading}
                    displayGrade
                    annotationData={[{ dataValue: adValues.anomalyGradeThresholdValue }]}
                  />
                  <EuiSpacer size="m" />
                  <TriggerExpressions
                    thresholdValue={adValues.anomalyConfidenceThresholdValue}
                    thresholdEnum={adValues.anomalyConfidenceThresholdEnum}
                    keyFieldName={`${fieldPath}anomalyDetector.anomalyConfidenceThresholdEnum`}
                    valueFieldName={`${fieldPath}anomalyDetector.anomalyConfidenceThresholdValue`}
                    label="Anomaly confidence threshold"
                  />
                  <EuiSpacer size="xs" />
                  <AnomaliesChart
                    showTitle={false}
                    showSettings={false}
                    startDateTime={anomalyData.previewStartTime}
                    endDateTime={anomalyData.previewEndTime}
                    anomalies={anomalyData.anomalyResult.anomalies}
                    isLoading={anomalyData.isLoading}
                    displayConfidence
                    annotationData={[{ dataValue: adValues.anomalyConfidenceThresholdValue }]}
                  />
                </React.Fragment>
              );
            } else {
              return _.isEmpty(detectorId) ? (
                <EmptyDetectorMessage />
              ) : (
                <EmptyFeaturesMessage detectorId={detectorId} isLoading={anomalyData.isLoading} />
              );
            }
          }}
        />
      </div>
    );
  }
}

export { AnomalyDetectorTrigger };
