/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { EuiSpacer } from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel';
import FormikFieldText from '../../../../components/FormControls/FormikFieldText';
import { hasError, isInvalid, required, validateMonitorName } from '../../../../utils/validate';
import Schedule from '../../components/Schedule';
import MonitorDefinitionCard from '../../components/MonitorDefinitionCard';
import MonitorType from '../../components/MonitorType';
import AnomalyDetectors from '../AnomalyDetectors/AnomalyDetectors';
import { MONITOR_TYPE } from '../../../../utils/constants';

const renderAnomalyDetector = ({ httpClient, values, detectorId, flyoutMode }) => ({
  actions: [],
  content: (
    <React.Fragment>
      <AnomalyDetectors
        httpClient={httpClient}
        values={values}
        renderEmptyMessage={renderEmptyMessage}
        detectorId={detectorId}
        flyoutMode={flyoutMode}
      />
    </React.Fragment>
  ),
});

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
  flyoutMode,
}) => {
  const anomalyDetectorContent =
    isAd && renderAnomalyDetector({ httpClient, values, detectorId, flyoutMode });
  const displayMonitorDefinitionCards = values.monitor_type !== MONITOR_TYPE.CLUSTER_METRICS;
  const Container = useMemo(() => (flyoutMode ? ({ children }) => <>{children}</> : ContentPanel), [
    flyoutMode,
  ]);

  return (
    <Container
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
      {!flyoutMode && <EuiSpacer size="s" />}
      <FormikFieldText
        name="name"
        formRow
        fieldProps={{ validate: validateMonitorName(httpClient, monitorToEdit, flyoutMode) }}
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
      {!flyoutMode && <MonitorType values={values} />}

      {!flyoutMode && displayMonitorDefinitionCards ? (
        <div>
          <EuiSpacer size="m" />
          <MonitorDefinitionCard values={values} plugins={plugins} />
        </div>
      ) : null}

      {isAd ? (
        <div>
          {!flyoutMode && <EuiSpacer size="l" />}
          {anomalyDetectorContent.content}
          {flyoutMode && <EuiSpacer size="m" />}
        </div>
      ) : null}

      {!flyoutMode && <EuiSpacer size="l" />}
      <Schedule isAd={isAd} flyoutMode={flyoutMode} />
    </Container>
  );
};

export default MonitorDetails;
