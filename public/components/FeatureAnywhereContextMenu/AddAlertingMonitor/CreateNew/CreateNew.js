/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { EuiTitle, EuiIcon, EuiText, EuiSwitch, EuiSpacer, EuiCallOut } from '@elastic/eui';
import { EmbeddablePanel } from '../../../../../../../src/plugins/embeddable/public';
import { NotificationService } from '../../../../services';
import _ from 'lodash';
import { FieldArray } from 'formik';
import DefineMonitor from '../../../../pages/CreateMonitor/containers/DefineMonitor';
import { formikToMonitor } from '../../../../pages/CreateMonitor/containers/CreateMonitor/utils/formikToMonitor';
import { SEARCH_TYPE } from '../../../../utils/constants';
import MonitorDetails from '../../../../pages/CreateMonitor/containers/MonitorDetails';
import ConfigureTriggers from '../../../../pages/CreateTrigger/containers/ConfigureTriggers';
import { unitToLabel } from '../../../../pages/CreateMonitor/components/Schedule/Frequencies/Interval';
import EnhancedAccordion from '../../EnhancedAccordion';
import { getPlugins } from '../../../../pages/CreateMonitor/containers/CreateMonitor/utils/helpers';
import { dotNotate } from '../../../../utils/SubmitErrorHandler';
import './styles.scss';

function CreateNew({ embeddable, core, flyoutMode, formikProps, history, setFlyout, detectorId }) {
  const { notifications, isDarkMode = false, http: httpClient } = core;
  const { values, errors, touched, isSubmitting, isValid } = formikProps;
  const [plugins, setPlugins] = useState([]);
  const isAd = values.searchType === SEARCH_TYPE.AD;
  const [accordionsOpen, setAccordionsOpen] = useState(detectorId ? { monitorDetails: true } : {});
  const [isShowVis, setIsShowVis] = useState(false);
  const title = embeddable.getTitle();
  const notificationService = useMemo(() => new NotificationService(core.http), [core]);
  const onAccordionToggle = (key) => {
    const newAccordionsOpen = { ...accordionsOpen };
    newAccordionsOpen[key] = !accordionsOpen[key];
    setAccordionsOpen(newAccordionsOpen);
  };
  const { isShowingErrors, errorList } = useMemo(() => {
    const isShowingErrors = Object.keys(errors).length > 0 && !isSubmitting && !isValid;
    const errorList = new Set();

    if (isShowingErrors) {
      const errorPaths = dotNotate(errors);

      Object.keys(errorPaths).forEach((path) => {
        errorList.add(errorPaths[path]);
      });
    }

    return { isShowingErrors, errorList: [...errorList] };
  }, [errors, isSubmitting, isValid]);

  // On load
  useEffect(() => {
    const updatePlugins = async () => {
      const newPlugins = await getPlugins(httpClient);
      setPlugins(newPlugins);
    };

    updatePlugins();
  }, []);

  return (
    <div className="create-new">
      <EuiText size="xs">
        <p>
          {flyoutMode === 'create' &&
            'Create query level monitor, associated with the visualization. Learn more in the documentation.'}
          {flyoutMode === 'adMonitor' &&
            'Set up and configure alerting monitor for the anomaly detector to receive notifications on visualization when anomalies detected.'}{' '}
          <a
            href="https://opensearch.org/docs/latest/monitoring-plugins/alerting/index/"
            target="_blank"
          >
            Learn more <EuiIcon type="popout" />
          </a>
        </p>
      </EuiText>
      {isShowingErrors && (
        <>
          <EuiSpacer size="m" />
          <EuiCallOut title="Address the following errors:" color="danger" iconType="alert">
            <ul>
              {errorList.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          </EuiCallOut>
        </>
      )}
      <EuiSpacer size="m" />
      <div className="create-new__title-and-toggle">
        <EuiTitle size="xxs">
          <h4>
            <EuiIcon type="visLine" className="create-new__title-icon" />
            {title}
          </h4>
        </EuiTitle>
        <EuiSwitch
          label="Show visualization"
          checked={isShowVis}
          onChange={() => setIsShowVis(!isShowVis)}
        />
      </div>
      <div className={`create-new__vis ${!isShowVis && 'create-new__vis--hidden'}`}>
        <EuiSpacer size="s" />
        <EmbeddablePanel
          embeddable={embeddable}
          getActions={() => Promise.resolve([])}
          inspector={{ isAvailable: () => false }}
          hideHeader
          isDestroyPrevented
          isBorderless
        />
      </div>
      <EuiSpacer size="l" />
      <EuiTitle size="s">
        <h3>Monitor details</h3>
      </EuiTitle>
      <EuiSpacer size="m" />

      <EnhancedAccordion
        {...{
          id: 'monitorDetails',
          isOpen: accordionsOpen.monitorDetails,
          onToggle: () => onAccordionToggle('monitorDetails'),
          title: values.name,
          subTitle: values.frequency === 'interval' && (
            <>
              <EuiText size="m" className="create-monitor__frequency">
                <p>
                  Runs every {values.period.interval} <span>{unitToLabel[values.period.unit]}</span>
                </p>
              </EuiText>
            </>
          ),
        }}
      >
        <MonitorDetails
          values={values}
          errors={errors}
          history={history}
          httpClient={httpClient}
          plugins={plugins}
          isAd={isAd}
          detectorId={detectorId}
          flyoutMode={flyoutMode}
        />
      </EnhancedAccordion>
      <EuiSpacer size="m" />
      {!isAd && (
        <EnhancedAccordion
          {...{
            id: 'advancedData',
            isOpen: accordionsOpen.advancedData,
            onToggle: () => onAccordionToggle('advancedData'),
            title: 'Advanced data source configuration',
          }}
        >
          <DefineMonitor
            values={values}
            errors={errors}
            touched={touched}
            httpClient={httpClient}
            location={location}
            detectorId={detectorId}
            notifications={notifications}
            isDarkMode={isDarkMode}
            flyoutMode={flyoutMode}
          />
        </EnhancedAccordion>
      )}
      <EuiSpacer size="xl" />
      <EuiTitle size="s">
        <h3>Triggers</h3>
      </EuiTitle>
      <EuiSpacer size="m" />
      <FieldArray name={'triggerDefinitions'} validateOnChange={true}>
        {(triggerArrayHelpers) => (
          <ConfigureTriggers
            triggerArrayHelpers={triggerArrayHelpers}
            monitor={formikToMonitor(values)}
            monitorValues={values}
            setFlyout={setFlyout}
            triggers={_.get(formikToMonitor(values), 'triggers', [])}
            triggerValues={values}
            isDarkMode={isDarkMode}
            httpClient={httpClient}
            notifications={notifications}
            notificationService={notificationService}
            plugins={plugins}
            flyoutMode={flyoutMode}
          />
        )}
      </FieldArray>
    </div>
  );
}

export default CreateNew;
