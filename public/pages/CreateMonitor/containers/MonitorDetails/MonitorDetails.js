/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React from 'react';
import { EuiSpacer } from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel';
import FormikFieldText from '../../../../components/FormControls/FormikFieldText';
import { hasError, isInvalid, required, validateMonitorName } from '../../../../utils/validate';
import Schedule from '../../components/Schedule';
import MonitorDefinitionCard from '../../components/MonitorDefinitionCard';
import MonitorType from '../../components/MonitorType';
import AnomalyDetectors from '../AnomalyDetectors/AnomalyDetectors';
import { MONITOR_TYPE } from '../../../../utils/constants';

const renderAnomalyDetector = (httpClient, values, detectorId) => {
  return {
    actions: [],
    content: (
      <React.Fragment>
        <AnomalyDetectors
          httpClient={httpClient}
          values={values}
          renderEmptyMessage={renderEmptyMessage}
          detectorId={detectorId}
        />
      </React.Fragment>
    ),
  };
};

function renderEmptyMessage(message) {
  return (
    <div style={{ padding: '20px', border: '1px solid #D9D9D9', borderRadius: '5px' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '450px' }}
      >
        <div>{message}</div>
      </div>
    </div>
  );
}

const MonitorDetails = ({
  values,
  errors,
  httpClient,
  monitorToEdit,
  isAd,
  plugins,
  detectorId,
}) => {
  const anomalyDetectorContent = isAd && renderAnomalyDetector(httpClient, values, detectorId);
  const displayMonitorDefinitionCards = values.monitor_type !== MONITOR_TYPE.CLUSTER_METRICS;
  return (
    <ContentPanel
      title="Monitor details"
      titleSize="s"
      panelStyles={{
        paddingBottom: '20px',
        paddingLeft: '10px',
        paddingRight: '10px',
        paddingTop: '20px',
      }}
      actions={anomalyDetectorContent.actions}
    >
      <EuiSpacer size="s" />
      <FormikFieldText
        name="name"
        formRow
        fieldProps={{ validate: validateMonitorName(httpClient, monitorToEdit) }}
        rowProps={{
          label: 'Monitor name',
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          isInvalid,
          /* To reduce the frequency of search request,
          the comprehensive 'validationMonitorName()' is only called onBlur,
          but we enable the basic 'required()' validation onChange for good user experience.*/
          onChange: (e, field, form) => {
            field.onChange(e);
            form.setFieldError('name', required(e.target.value));
          },
        }}
      />
      <EuiSpacer size="m" />
      <MonitorType values={values} />

      {displayMonitorDefinitionCards ? (
        <div>
          <EuiSpacer size="m" />
          <MonitorDefinitionCard values={values} plugins={plugins} />
        </div>
      ) : null}

      {isAd ? (
        <div>
          <EuiSpacer size="l" />
          {anomalyDetectorContent.content}
        </div>
      ) : null}

      <EuiSpacer size="l" />
      <Schedule isAd={isAd} />
    </ContentPanel>
  );
};

export default MonitorDetails;
