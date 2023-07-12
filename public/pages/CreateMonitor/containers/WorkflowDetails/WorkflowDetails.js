/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ContentPanel from '../../../../components/ContentPanel';
import Schedule from '../../components/Schedule';
import AssociateMonitors from '../../components/AssociateMonitors/AssociateMonitors';
import { EuiSpacer } from '@elastic/eui';

const WorkflowDetails = ({ values, isDarkMode, httpClient, errors }) => {
  return (
    <ContentPanel
      title="Workflow"
      titleSize="s"
      panelStyles={{
        paddingBottom: '20px',
        paddingLeft: '10px',
        paddingRight: '10px',
        paddingTop: '20px',
      }}
    >
      <Schedule isAd={false} />

      <EuiSpacer size="xl" />
      <AssociateMonitors
        isDarkMode={isDarkMode}
        values={values}
        httpClient={httpClient}
        errors={errors}
      />
    </ContentPanel>
  );
};

export default WorkflowDetails;
