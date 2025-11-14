/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiSpacer } from '@elastic/eui';
import VisualGraph from '../../CreateMonitor/components/VisualGraph';
import TriggerExpressions from './TriggerExpressions';

/**
 * V1/Legacy Trigger Graph Component
 * Uses the original VisualGraph for classic monitors
 */
const TriggerGraphV1 = ({
  monitorValues,
  response,
  thresholdValue,
  thresholdEnum,
  fieldPath,
  flyoutMode,
}) => (
  <div style={flyoutMode ? {} : { padding: '0px 10px' }}>
    <TriggerExpressions
      thresholdValue={thresholdValue}
      thresholdEnum={thresholdEnum}
      keyFieldName={`${fieldPath}thresholdEnum`}
      valueFieldName={`${fieldPath}thresholdValue`}
      label="Trigger condition"
      flyoutMode={flyoutMode}
    />
    {!flyoutMode && (
      <>
        <EuiSpacer size="m" />
        <VisualGraph
          annotation
          values={monitorValues}
          thresholdValue={thresholdValue}
          response={response}
        />
      </>
    )}
  </div>
);

TriggerGraphV1.propTypes = {
  monitorValues: PropTypes.object,
  response: PropTypes.any,
  thresholdValue: PropTypes.any,
  thresholdEnum: PropTypes.any,
  fieldPath: PropTypes.string,
  flyoutMode: PropTypes.bool,
};

export default TriggerGraphV1;

