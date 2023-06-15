/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import DefineCompositeLevelTrigger from './DefineCompositeLevelTrigger';

const CompositeMonitorsAlertTrigger = ({
  edit,
  triggerArrayHelpers,
  monitor,
  monitorValues,
  triggerValues,
  isDarkMode,
  httpClient,
  notifications,
  notificationService,
  plugins,
}) => {
  return (
    <Fragment>
      <DefineCompositeLevelTrigger
        edit={edit}
        triggerArrayHelpers={triggerArrayHelpers}
        monitor={monitor}
        monitorValues={monitorValues}
        triggerValues={triggerValues}
        isDarkMode={isDarkMode}
        httpClient={httpClient}
        notifications={notifications}
        notificationService={notificationService}
        plugins={plugins}
      />
    </Fragment>
  );
};
export default CompositeMonitorsAlertTrigger;
