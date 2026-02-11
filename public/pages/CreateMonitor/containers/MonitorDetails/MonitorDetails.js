/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, Fragment } from 'react';
import { EuiSpacer, EuiCallOut } from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel';
import FormikFieldText from '../../../../components/FormControls/FormikFieldText';
import { hasError, isInvalid, required, validateMonitorName } from '../../../../utils/validate';
import MonitorDefinitionCard from '../../components/MonitorDefinitionCard';
import MonitorType from '../../components/MonitorType';
import AnomalyDetectors from '../AnomalyDetectors/AnomalyDetectors';
import { MONITOR_TYPE } from '../../../../utils/constants';
import Schedule from '../../components/Schedule';

const renderAnomalyDetector = ({
  httpClient,
  values,
  detectorId,
  flyoutMode,
  landingDataSourceId,
}) => ({
  actions: [],
  content: (
    <React.Fragment>
      <AnomalyDetectors
        httpClient={httpClient}
        values={values}
        renderEmptyMessage={renderEmptyMessage}
        detectorId={detectorId}
        flyoutMode={flyoutMode}
        landingDataSourceId={landingDataSourceId}
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
  landingDataSourceId,
}) => {
  const anomalyDetectorContent =
    isAd &&
    renderAnomalyDetector({ httpClient, values, detectorId, flyoutMode, landingDataSourceId });
  const displayMonitorDefinitionCards = values.monitor_type !== MONITOR_TYPE.CLUSTER_METRICS;
  const Container = useMemo(
    () => (flyoutMode ? ({ children }) => <>{children}</> : ContentPanel),
    [flyoutMode]
  );

  return (
    <Container
      title="Monitor details"
      titleSize="s"
      panelStyles={{ padding: '16px' }}
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

      {values.preventVisualEditor && (
        <Fragment>
          <EuiSpacer size={'l'} />
          <EuiCallOut
            title="You have advanced configurations not supported by the visual editor"
            iconType="iInCircle"
            color={'warning'}
          >
            <p>
              To view or modify all of your configurations, switch to the Extraction query editor.
            </p>
          </EuiCallOut>
        </Fragment>
      )}
      {!flyoutMode && <EuiSpacer size="l" />}
      {values.monitor_type !== MONITOR_TYPE.COMPOSITE_LEVEL ? (
        <Schedule isAd={isAd} flyoutMode={flyoutMode} />
      ) : null}
    </Container>
  );
};

export default MonitorDetails;
