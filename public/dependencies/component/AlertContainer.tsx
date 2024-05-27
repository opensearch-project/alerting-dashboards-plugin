/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiButton, EuiCallOut,
  EuiFlexGroup, EuiFlexItem,
  EuiSpacer, EuiText, EuiTitle,
} from '@elastic/eui';
import _ from 'lodash';
import { FieldArray, Formik } from 'formik';
import {
  getClient,
  getNotifications,
  getUISettings,
  NotificationService,
} from '../../services';
import {
  getInitialValues,
  getPlugins,
  submit,
} from '../../pages/CreateMonitor/containers/CreateMonitor/utils/helpers';
import DefineMonitor from '../../pages/CreateMonitor/containers/DefineMonitor';
import { formikToMonitor } from '../../pages/CreateMonitor/containers/CreateMonitor/utils/formikToMonitor';
import MonitorDetails from '../../pages/CreateMonitor/containers/MonitorDetails';
import ConfigureTriggers from '../../pages/CreateTrigger/containers/ConfigureTriggers';
import { unitToLabel } from '../../pages/CreateMonitor/components/Schedule/Frequencies/Interval';
import EnhancedAccordion from '../../components/FeatureAnywhereContextMenu/EnhancedAccordion';
import './styles.scss';

function AlertContainer(props: {content: string}) {
  const isDarkMode = getUISettings().get('theme:darkMode') || false;
  const setFlyout = () => null;
  const httpClient = getClient();
  const notifications = getNotifications();
  const searchType = '';
  const flyoutMode = 'olly';
  const history = {
    location: { pathname: '/create-monitor', search: props.content, hash: '', state: undefined },
    push: () => null,
    goBack: null,
  };
  const initialValues = useMemo(
    () =>
      getInitialValues({ ...history,  searchType }),
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [plugins, setPlugins] = useState([]);
  const notificationService = useMemo(() => new NotificationService(httpClient), []);
  const [accordionsOpen, setAccordionsOpen] = useState<{[key: string]: boolean}>({ monitorDetails: false, defineMonitor: true});

  const onAccordionToggle = (key: string) => {
    if (key in accordionsOpen) {
      setAccordionsOpen({ ...accordionsOpen, [key]: !accordionsOpen[key]});
    }
  };

  const onCreate = useCallback( async (values, formikBag) => {
      submit({
        values,
        formikBag,
        history,
        updateMonitor: () => null,
        notifications,
        httpClient,
        onSuccess: async ({ monitor }) => {
          setIsDisabled(true)
          setIsLoading(false)
          notifications.toasts.addSuccess(`Monitor "${monitor.name}" successfully created.`);
        },
      });
  }, [history, notifications, httpClient]);
  const onSubmit = useCallback( async ({ handleSubmit, validateForm }) => {
    setIsLoading(true);
    const errors = await validateForm();

    if (Object.keys(errors).length > 0) {
      // Delay to allow errors to render
      setTimeout(() => {
        document
        .querySelector('.alert-container__scroll')
        ?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
      setIsLoading(false);
    }

    const hasErrorInMonitorDetails = 'name' in errors;
    const hasErrorInDefineMonitor = 'aggregations' in errors || 'groupBy' in errors ||
      'where' in errors || 'bucketValue' in errors;
    if (hasErrorInMonitorDetails != accordionsOpen.monitorDetails ||
      hasErrorInDefineMonitor != accordionsOpen.defineMonitor) {
      setAccordionsOpen({ ...accordionsOpen,
        monitorDetails: hasErrorInMonitorDetails || accordionsOpen.monitorDetails,
        defineMonitor: hasErrorInDefineMonitor || accordionsOpen.defineMonitor});
    }

    handleSubmit();
  }, [setIsLoading, accordionsOpen, setAccordionsOpen]);

  useEffect(() => {
    const updatePlugins = async () => {
      const newPlugins = await getPlugins(httpClient);
      setPlugins(newPlugins);
    };

    updatePlugins();
  }, []);

  return (
      <Formik initialValues={initialValues} onSubmit={onCreate} validateOnChange={false} >
        {(formikProps) => {
          const {values, handleSubmit, errors, touched, validateForm} = formikProps;
          const errorList = Object.entries(errors) as [string, string][];

          return (
            <div className="alert-container">
              {errorList.length > 0 && (
                <>
                  <EuiSpacer size="m" />
                  <EuiCallOut title="Address the following errors:" color="danger" iconType="alert">
                    <ul>
                      {
                        errorList.map(([k, v]) => (<li key={k}>{v}</li>))
                      }
                    </ul>
                  </EuiCallOut>
                </>
              )}
              <EuiSpacer size="m" />
              <div className="alert-container__scroll">
                <EnhancedAccordion
                  {...{
                    id: 'monitorDetails',
                    isOpen: accordionsOpen.monitorDetails,
                    onToggle: () => onAccordionToggle('monitorDetails'),
                    title: values.name,
                    subTitle: (
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
                    isAd={false}
                    flyoutMode={flyoutMode} />
                </EnhancedAccordion>
                <EuiSpacer size="m" />

                <EnhancedAccordion
                  {...{
                    id: 'defineMonitor',
                    isOpen: accordionsOpen.defineMonitor,
                    onToggle: () => onAccordionToggle('defineMonitor'),
                    title: 'Advanced data source configuration',
                  }}
                >
                  <DefineMonitor
                    values={values}
                    errors={errors}
                    touched={touched}
                    httpClient={httpClient}
                    location={location}
                    notifications={notifications}
                    isDarkMode={isDarkMode}
                    flyoutMode={flyoutMode}
                  />
                </EnhancedAccordion>
                <EuiSpacer size="m" />

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
                      submitCount={formikProps.submitCount}
                      errors={errors}
                    />
                  )}
                </FieldArray>

                <EuiSpacer size="l" />
              </div>
              <div style={{ position: 'relative' }}>
                <EuiFlexGroup justifyContent="spaceBetween" >
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      onClick={() => onSubmit({ handleSubmit, validateForm })}
                      fill
                      isLoading={isLoading}
                      disabled={isDisabled}
                    >
                      {isDisabled ? 'Monitor Created'  : 'Create monitor'}
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </div>

            </div>
          );
        }}
      </Formik>
  );
}

export default AlertContainer;
