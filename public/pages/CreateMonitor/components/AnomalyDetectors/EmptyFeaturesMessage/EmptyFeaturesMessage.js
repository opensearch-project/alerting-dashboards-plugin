/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiEmptyPrompt, EuiButton, EuiText, EuiLoadingChart } from '@elastic/eui';
import { OPENSEARCH_DASHBOARDS_AD_PLUGIN, AD_PREVIEW_DAYS } from '../../../../../utils/constants';

const ErrorType = {
  PREVIEW_EXCEPTION: 0,
  NO_FEATURE: 1,
  NO_ENABLED_FEATURES: 2,
  SPARSE_DATA: 3,
};

/**
 *
 * @param {string} errorType error type
 * @param {*} err error message
 * @param {*} isHCDetector whether the detector is HC
 * @returns error messages to show on the empty trigger page
 */
function getErrorMsg(errorType, err, isHCDetector) {
  switch (errorType) {
    case ErrorType.PREVIEW_EXCEPTION:
      return err;
    case ErrorType.NO_FEATURE:
      return 'No features have been added to this anomaly detector. A feature is a metric that is used for anomaly detection. A detector can discover anomalies across one or more features.';
    case ErrorType.NO_ENABLED_FEATURES:
      return 'No features have been enabled in this anomaly detector. A feature is a metric that is used for anomaly detection. A detector can discover anomalies across one or more features.';
    case ErrorType.SPARSE_DATA:
      return `No sample anomaly result generated. Please check detector interval and make sure you have >400 data points${
        isHCDetector ? ' for some entities ' : ' '
      }in the last ${AD_PREVIEW_DAYS} days`;
    default:
      console.log('unexpected error type: ' + errorType);
      return '';
  }
}

// FunctionComponent
const ActionUI = ({ errorType, err, detectorId }) => {
  switch (errorType) {
    case ErrorType.PREVIEW_EXCEPTION:
      // we have already showed error msg. No need to show it again
      // and return empty text here.
      return <EuiText data-test-subj="callOut"></EuiText>;
    case ErrorType.NO_FEATURE:
      return (
        <EuiButton
          data-test-subj="createButton"
          href={`${OPENSEARCH_DASHBOARDS_AD_PLUGIN}#/detectors/${detectorId}/features`}
          target="_blank"
        >
          Add Feature
        </EuiButton>
      );
    case ErrorType.NO_ENABLED_FEATURES:
      return (
        <EuiButton
          data-test-subj="editButton"
          href={`${OPENSEARCH_DASHBOARDS_AD_PLUGIN}#/detectors/${detectorId}/features`}
          target="_blank"
        >
          Enable Feature
        </EuiButton>
      );
    case ErrorType.SPARSE_DATA:
      return (
        <EuiButton
          data-test-subj="editConfigButton"
          href={`${OPENSEARCH_DASHBOARDS_AD_PLUGIN}#/detectors/${detectorId}/configurations`}
          target="_blank"
        >
          Check Detector Interval
        </EuiButton>
      );
    default:
      console.log('unexpected error type: ' + errorType);
      return <EuiText data-test-subj="callOut">''</EuiText>;
  }
};

/**
 *
 * @param {string} err if there is any exception or error running preview API,
     err is not empty.
 * @param {*} features detector features
 * @returns error type
 */
function getErrorType(err, features) {
  // if error is a non-empty string, return it.
  if (err) return ErrorType.PREVIEW_EXCEPTION;

  if (features === undefined || features.length == 0) {
    return ErrorType.NO_FEATURE;
  }

  const enabledFeatures = features.filter((feature) => feature.featureEnabled);
  if (enabledFeatures.length == 0) {
    return ErrorType.NO_ENABLED_FEATURES;
  }

  // sparse data
  return ErrorType.SPARSE_DATA;
}

const EmptyFeaturesMessage = (props) => {
  const errorType = getErrorType(props.error, props.features);
  const errorMsg = getErrorMsg(errorType, props.error, props.isHCDetector);

  return (
    <div
      style={{
        borderRadius: '5px',
        padding: '10px',
        border: '1px solid #D9D9D9',
        height: '250px',
        width: '100%',
        ...props.containerStyle,
      }}
    >
      {props.isLoading ? (
        <EuiEmptyPrompt style={{ maxWidth: '45em' }} body={<EuiLoadingChart size="xl" />} />
      ) : (
        <EuiEmptyPrompt
          data-test-subj="empty-prompt"
          style={{ maxWidth: '45em' }}
          body={<EuiText>{errorMsg}</EuiText>}
          actions={[
            <ActionUI errorType={errorType} err={props.error} detectorId={props.detectorId} />,
          ]}
        />
      )}
    </div>
  );
};

EmptyFeaturesMessage.propTypes = {
  detectorId: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  containerStyle: PropTypes.object,
  error: PropTypes.string.isRequired,
  isHCDetector: PropTypes.bool.isRequired,
  features: PropTypes.array.isRequired,
};
EmptyFeaturesMessage.defaultProps = {
  detectorId: '',
  containerStyle: {},
};

export { EmptyFeaturesMessage };
