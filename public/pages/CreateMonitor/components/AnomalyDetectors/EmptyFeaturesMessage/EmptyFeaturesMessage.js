/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiEmptyPrompt, EuiButton, EuiText, EuiLoadingChart } from '@elastic/eui';
import {
  OPENSEARCH_DASHBOARDS_AD_PLUGIN,
  PREVIEW_ERROR_TYPE,
} from '../../../../../utils/constants';

/**
 *
 * @param {string} errorType error type
 * @param {*} err error message
 * @param {*} isHCDetector whether the detector is HC
 * @returns error messages to show on the empty trigger page
 */
function getErrorMsg(errorType, err, isHCDetector) {
  switch (errorType) {
    case PREVIEW_ERROR_TYPE.NO_FEATURE:
      return 'No features have been added to this anomaly detector. A feature is a metric that is used for anomaly detection. A detector can discover anomalies across one or more features.';
    case PREVIEW_ERROR_TYPE.NO_ENABLED_FEATURES:
      return 'No features have been enabled in this anomaly detector. A feature is a metric that is used for anomaly detection. A detector can discover anomalies across one or more features.';
    default:
      console.log('We only deal with feature related error type in this page: ' + errorType);
      return '';
  }
}

// FunctionComponent
const ActionUI = ({ errorType, detectorId }) => {
  switch (errorType) {
    case PREVIEW_ERROR_TYPE.NO_FEATURE:
      return (
        <EuiButton
          data-test-subj="createButton"
          href={`${OPENSEARCH_DASHBOARDS_AD_PLUGIN}#/detectors/${detectorId}/features`}
          target="_blank"
        >
          Add Feature
        </EuiButton>
      );
    case PREVIEW_ERROR_TYPE.NO_ENABLED_FEATURES:
      return (
        <EuiButton
          data-test-subj="editButton"
          href={`${OPENSEARCH_DASHBOARDS_AD_PLUGIN}#/detectors/${detectorId}/features`}
          target="_blank"
        >
          Enable Feature
        </EuiButton>
      );
    default:
      console.log('We only deal with feature related error type in this page: ' + errorType);
      return <EuiText data-test-subj="callOut">''</EuiText>;
  }
};

const EmptyFeaturesMessage = (props) => {
  const errorMsg = getErrorMsg(props.previewErrorType, props.error, props.isHCDetector);

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
          actions={[<ActionUI errorType={props.previewErrorType} detectorId={props.detectorId} />]}
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
  previewErrorType: PropTypes.number.isRequired,
};
EmptyFeaturesMessage.defaultProps = {
  detectorId: '',
  containerStyle: {},
};

export { EmptyFeaturesMessage };
