/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import TriggerGraphV1 from './TriggerGraphV1';
import TriggerGraphV2 from './TriggerGraphV2';

/**
 * TriggerGraph Router Component
 * Routes to V1 (legacy) or V2 (PPL) trigger graph based on monitor_mode
 */
const TriggerGraph = (props) => {
  const { monitorValues } = props;
  
  // Use V2 graph only when explicitly in PPL mode, otherwise use V1 legacy graph
  const isPPLMode = monitorValues?.monitor_mode === 'ppl';
  
  if (isPPLMode) {
    return <TriggerGraphV2 {...props} />;
  }
  
  return <TriggerGraphV1 {...props} />;
};

TriggerGraph.propTypes = {
  monitorValues: PropTypes.object,
  response: PropTypes.any,
  thresholdValue: PropTypes.any,
  thresholdEnum: PropTypes.any,
  fieldPath: PropTypes.string,
  flyoutMode: PropTypes.bool,
  hideThresholdControls: PropTypes.bool,
  showModeSelector: PropTypes.bool,
};

export default TriggerGraph;


