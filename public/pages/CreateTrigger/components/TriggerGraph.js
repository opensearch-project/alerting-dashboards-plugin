/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSpacer } from '@elastic/eui';
import VisualGraph from '../../CreateMonitor/components/VisualGraph';
import TriggerExpressions from './TriggerExpressions';

const TriggerGraph = ({ monitorValues, response, thresholdValue, thresholdEnum, fieldPath }) => (
  <div style={{ padding: '0px 10px' }}>
    <TriggerExpressions
      thresholdValue={thresholdValue}
      thresholdEnum={thresholdEnum}
      keyFieldName={`${fieldPath}thresholdEnum`}
      valueFieldName={`${fieldPath}thresholdValue`}
      label="Trigger condition"
    />
    <EuiSpacer size="m" />
    <VisualGraph
      annotation
      values={monitorValues}
      thresholdValue={thresholdValue}
      response={response}
    />
  </div>
);

export default TriggerGraph;
