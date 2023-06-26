/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import ContentPanel from '../../../../components/ContentPanel';
import Schedule from '../../components/Schedule';
import AssociateMonitors from '../../components/AssociateMonitors/AssociateMonitors';
import { EuiSpacer } from '@elastic/eui';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';

const WorkflowDetails = ({ values, isDarkMode, httpClient, errors }) => {
  const isAd = values.searchType === SEARCH_TYPE.AD;
  const isComposite = values.monitor_type === MONITOR_TYPE.COMPOSITE_LEVEL;
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
      <Schedule isAd={isAd} />

      {isComposite && (
        <Fragment>
          <EuiSpacer size="xl" />
          <AssociateMonitors
            isDarkMode={isDarkMode}
            values={values}
            httpClient={httpClient}
            errors={errors}
          />
        </Fragment>
      )}
    </ContentPanel>
  );
};

export default WorkflowDetails;
