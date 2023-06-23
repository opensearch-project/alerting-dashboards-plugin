/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import DefineCompositeLevelTrigger from './DefineCompositeLevelTrigger';

const CompositeMonitorsAlertTrigger = ({
  isDarkMode,
  httpClient,
  notifications,
  notificationService,
  plugins,
  values,
}) => {
  return (
    <Fragment>
      <DefineCompositeLevelTrigger
        values={values}
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
