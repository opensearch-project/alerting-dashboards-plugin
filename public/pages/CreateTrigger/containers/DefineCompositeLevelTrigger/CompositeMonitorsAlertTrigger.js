/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import DefineCompositeLevelTrigger from './DefineCompositeLevelTrigger';

const CompositeMonitorsAlertTrigger = ({
  edit,
  isDarkMode,
  httpClient,
  notifications,
  notificationService,
  plugins,
  values,
  touched,
}) => {
  return (
    <Fragment>
      <DefineCompositeLevelTrigger
        edit={edit}
        values={values}
        touched={touched}
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
