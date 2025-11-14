/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import DefineTriggerV1 from './DefineTriggerV1';
import DefineTriggerV2 from './DefineTriggerV2';

/**
 * Router component that renders either V1 (classic) or V2 (PPL) DefineTrigger
 * based on the monitor_mode in monitorValues.
 */
class DefineTrigger extends React.Component {
  render() {
    const { monitorValues } = this.props;
    
    const isPPLMode = monitorValues?.monitor_mode === 'ppl';
    
    if (isPPLMode) {
      return <DefineTriggerV2 {...this.props} />;
    }
    
    return <DefineTriggerV1 {...this.props} />;
  }
}

DefineTrigger.propTypes = {
  executeResponse: PropTypes.object,
  monitorValues: PropTypes.object.isRequired,
  onRun: PropTypes.func.isRequired,
  setFlyout: PropTypes.func.isRequired,
  triggers: PropTypes.arrayOf(PropTypes.object).isRequired,
  triggerValues: PropTypes.object.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
  flyoutMode: PropTypes.string,
  submitCount: PropTypes.number,
  edit: PropTypes.bool,
  triggerArrayHelpers: PropTypes.object,
  monitor: PropTypes.object,
  triggerIndex: PropTypes.number,
  httpClient: PropTypes.object,
  notifications: PropTypes.object,
  notificationService: PropTypes.object,
  plugins: PropTypes.array,
  errors: PropTypes.object,
};

export default DefineTrigger;

