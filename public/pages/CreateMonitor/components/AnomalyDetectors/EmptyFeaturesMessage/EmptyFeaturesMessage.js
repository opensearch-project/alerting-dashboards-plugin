/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiEmptyPrompt, EuiButton, EuiText, EuiLoadingChart } from '@elastic/eui';
import { OPENSEARCH_DASHBOARDS_AD_PLUGIN } from '../../../../../utils/constants';

const EmptyFeaturesMessage = (props) => (
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
        style={{ maxWidth: '45em' }}
        body={
          <EuiText>
            No features have been added to this anomaly detector. A feature is a metric that is used
            for anomaly detection. A detector can discover anomalies across one or more features.
          </EuiText>
        }
        actions={[
          <EuiButton
            data-test-subj="createButton"
            href={`${OPENSEARCH_DASHBOARDS_AD_PLUGIN}#/detectors/${props.detectorId}/features`}
            target="_blank"
          >
            Add Feature
          </EuiButton>,
        ]}
      />
    )}
  </div>
);

EmptyFeaturesMessage.propTypes = {
  detectorId: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  containerStyle: PropTypes.object,
};
EmptyFeaturesMessage.defaultProps = {
  detectorId: '',
  containerStyle: {},
};

export { EmptyFeaturesMessage };
