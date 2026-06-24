/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Fragment } from 'react';
import _ from 'lodash';
import { FieldArray, Formik } from 'formik';
import {
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel';
import DefineMonitor from '../DefineMonitor';
import { FORMIK_INITIAL_VALUES } from './utils/constants';
import { formikToMonitor } from './utils/formikToMonitor';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { SubmitErrorHandler } from '../../../../utils/SubmitErrorHandler';
import MonitorDetails from '../MonitorDetails';
import ConfigureTriggers from '../../../CreateTrigger/containers/ConfigureTriggers';
import ConfigureTriggersPpl from '../../../CreateTrigger/containers/ConfigureTriggers/ConfigureTriggersPpl';
import WorkflowDetails from '../WorkflowDetails/WorkflowDetails';
import { getInitialValues, getPlugins, submit } from './utils/helpers';
import { submitPPL } from './utils/pplAlertingHelpers';
import {
  getPerformanceModal,
  RECOMMENDED_DURATION,
} from '../../components/QueryPerformance/QueryPerformance';
import { isDataSourceChanged } from '../../../utils/helpers';
import { isMustangDomain } from '../../../../utils/helpers';
import { PageHeader } from '../../../../components/PageHeader/PageHeader';
import { PplScheduleEditor } from '../../../../components/PplScheduleEditor';
import { buildPplMonitorForTriggers } from '../../../../utils/buildPplMonitorForTriggers';

export default class CreateMonitor extends Component {
  static defaultProps = {
    edit: false,
    monitorToEdit: null,
    detectorId: null,
    updateMonitor: () => {},
    isDarkMode: false,
  };

  constructor(props) {
    super(props);

    const { location, edit, monitorToEdit } = props;
    const initialValues = getInitialValues({ location, monitorToEdit, edit });
    initialValues.dataSourceEndpoint = props.dataSourceEndpoint || '';

    this.state = {
      plugins: [],
      response: null,
      performanceResponse: null,
      initialValues,
      triggerToEdit: initialValues.triggerDefinitions || [],
      createModalOpen: false,
      formikBag: undefined,
      pplDateFields: {
        availableDateFields: [],
        error: null,
        loading: false,
      },
    };

    this.onCancel = this.onCancel.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.evaluateSubmission = this.evaluateSubmission.bind(this);
  }

  componentDidMount() {
    const { httpClient } = this.props;

    const updatePlugins = async () => {
      const newPlugins = await getPlugins(httpClient);
      this.setState({ plugins: newPlugins });
    };

    updatePlugins();
    this.setSchedule();
  }

  resetResponse() {
    this.setState({ response: null, performanceResponse: null });
  }

  onCancel() {
    if (this.props.edit) this.props.history.goBack();
    else this.props.history.push('/monitors');
  }

  setSchedule = () => {
    const { edit, monitorToEdit } = this.props;
    const { initialValues } = this.state;

    if (edit) {
      const schedule = _.get(monitorToEdit, 'schedule', FORMIK_INITIAL_VALUES.period);
      const scheduleType = _.keys(schedule)[0];
      switch (scheduleType) {
        case 'cron':
          _.set(initialValues, 'frequency', 'cronExpression');
          break;
        default:
          _.set(initialValues, 'period', schedule.period);
          break;
      }
    }
  };

  evaluateSubmission(values, formikBag) {
    const { performanceResponse } = this.props;
    const { createModalOpen } = this.state;
    const monitorDurationCallout = _.get(performanceResponse, 'took') >= RECOMMENDED_DURATION;

    // TODO: Need to confirm the purpose of requestDuration.
    //  There's no explanation for it in the frontend code even back to opendistro implementation.
    const requestDurationCallout =
      _.get(performanceResponse, 'invalid.path') >= RECOMMENDED_DURATION;
    const displayPerfCallOut = monitorDurationCallout || requestDurationCallout;

    if (!createModalOpen && displayPerfCallOut) {
      this.setState({
        createModalOpen: true,
        formikBag: formikBag,
      });
    } else {
      this.onSubmit(values, formikBag);
    }
  }

  onSubmit(values, formikBag) {
    const { edit, history, updateMonitor, notifications, httpClient, monitorToEdit } = this.props;
    const { triggerToEdit } = this.state;

    if (values.monitor_type === MONITOR_TYPE.PPL) {
      submitPPL({
        values,
        formikBag,
        edit,
        monitorToEdit,
        history,
        notifications,
        httpClient,
        dataSourceId: values.dataSourceId || this.props.landingDataSourceId,
      });
      return;
    }

    submit({
      values,
      formikBag,
      edit,
      triggerToEdit,
      history,
      updateMonitor,
      notifications,
      httpClient,
      onSuccess: async ({ monitor }) => {
        notifications.toasts.addSuccess(`Monitor "${monitor.name}" successfully created.`);
      },
    });
  }

  onCloseTrigger = () => {
    this.props.history.push({ ...this.props.location, search: '' });
  };

  componentWillUnmount() {
    this.props.setFlyout(null);
  }

  componentDidUpdate(prevProps) {
    if (isDataSourceChanged(prevProps, this.props)) {
      const mustang = isMustangDomain(this.props.landingDataSourceId);
      const monitorTypeOverrides = mustang
        ? { monitor_type: MONITOR_TYPE.PPL, searchType: SEARCH_TYPE.PPL }
        : { monitor_type: MONITOR_TYPE.QUERY_LEVEL, searchType: SEARCH_TYPE.GRAPH };
      this.setState({
        initialValues: {
          ...this.state.initialValues,
          dataSourceId: this.props.landingDataSourceId,
          dataSourceEndpoint: this.props.dataSourceEndpoint,
          ...monitorTypeOverrides,
        },
      });
    }
  }

  buildPplMonitorForTriggers = (values) => buildPplMonitorForTriggers(values);

  handlePplDateFieldsChange = (dateFieldsState) => {
    this.setState({ pplDateFields: dateFieldsState });
  };

  renderPplSchedule(values, setFieldValue) {
    const { pplDateFields } = this.state;
    const {
      availableDateFields,
      error: dateFieldsError,
      loading: dateFieldsLoading,
    } = pplDateFields;

    // Auto-select the first detected date field if the current value isn't in the list
    if (availableDateFields.length > 0 && !availableDateFields.includes(values.timestampField)) {
      setFieldValue('timestampField', availableDateFields[0]);
    }

    return (
      <ContentPanel title="Schedule" titleSize="s">
        <PplScheduleEditor
          frequency={values.frequency}
          period={values.period}
          cronExpression={values.cronExpression}
          useLookBackWindow={values.useLookBackWindow}
          lookBackAmount={values.lookBackAmount}
          lookBackUnit={values.lookBackUnit}
          timestampField={values.timestampField}
          setFieldValue={setFieldValue}
          availableDateFields={availableDateFields}
          dateFieldsError={dateFieldsError}
          dateFieldsLoading={dateFieldsLoading}
          isEdit={this.props.edit}
          isMustang={isMustangDomain(this.props.landingDataSourceId)}
        />
      </ContentPanel>
    );
  }

  render() {
    const {
      edit,
      history,
      httpClient,
      location,
      monitorToEdit,
      notifications,
      isDarkMode,
      notificationService,
    } = this.props;
    const { createModalOpen, initialValues, plugins } = this.state;

    return (
      <div style={{ padding: '16px' }}>
        <Formik
          initialValues={initialValues}
          onSubmit={this.evaluateSubmission}
          validateOnChange={false}
          enableReinitialize={true}
        >
          {({ values, errors, handleSubmit, isSubmitting, isValid, touched, setFieldValue }) => {
            const isComposite = values.monitor_type === MONITOR_TYPE.COMPOSITE_LEVEL;
            const isPpl = values.monitor_type === MONITOR_TYPE.PPL;

            return (
              <Fragment>
                <PageHeader>
                  <EuiText size="s">
                    <h1>{edit ? 'Edit' : 'Create'} monitor</h1>
                  </EuiText>
                  <EuiSpacer />
                </PageHeader>

                <MonitorDetails
                  values={values}
                  errors={errors}
                  history={history}
                  httpClient={httpClient}
                  monitorToEdit={monitorToEdit}
                  plugins={plugins}
                  isAd={values.searchType === SEARCH_TYPE.AD}
                  detectorId={this.props.detectorId}
                  setFlyout={this.props.setFlyout}
                  landingDataSourceId={this.props.landingDataSourceId}
                  isServerless={this.props.isServerless}
                />

                {values.preventVisualEditor ? null : (
                  <Fragment>
                    {isComposite ? (
                      <>
                        <EuiSpacer />
                        <WorkflowDetails
                          isDarkMode={isDarkMode}
                          values={values}
                          httpClient={httpClient}
                          errors={errors}
                        />
                      </>
                    ) : null}

                    <EuiSpacer />

                    {values.searchType !== SEARCH_TYPE.AD &&
                      values.monitor_type !== MONITOR_TYPE.COMPOSITE_LEVEL && (
                        <div>
                          <DefineMonitor
                            values={values}
                            errors={errors}
                            touched={touched}
                            httpClient={httpClient}
                            location={location}
                            detectorId={this.props.detectorId}
                            notifications={notifications}
                            isDarkMode={isDarkMode}
                            landingDataSourceId={this.props.landingDataSourceId}
                            services={this.props.services}
                            onPplQueryChange={
                              isPpl ? (text) => setFieldValue('pplQuery', text) : undefined
                            }
                            onPplDateFieldsChange={
                              isPpl ? this.handlePplDateFieldsChange : undefined
                            }
                          />
                          <EuiSpacer />
                        </div>
                      )}

                    {isPpl && (
                      <>
                        {this.renderPplSchedule(values, setFieldValue)}
                        <EuiSpacer />
                      </>
                    )}

                    {isPpl ? (
                      <FieldArray name="triggerDefinitions" validateOnChange={true}>
                        {(triggerArrayHelpers) => (
                          <ConfigureTriggersPpl
                            triggerArrayHelpers={triggerArrayHelpers}
                            edit={edit}
                            monitor={this.buildPplMonitorForTriggers(values)}
                            monitorValues={values}
                            setFlyout={this.props.setFlyout}
                            triggers={_.cloneDeep(values.triggerDefinitions || [])}
                            triggerValues={values}
                            isDarkMode={isDarkMode}
                            httpClient={httpClient}
                            notifications={notifications}
                            notificationService={notificationService}
                            plugins={plugins}
                          />
                        )}
                      </FieldArray>
                    ) : (
                      <FieldArray name={'triggerDefinitions'} validateOnChange={true}>
                        {(triggerArrayHelpers) => (
                          <ConfigureTriggers
                            edit={edit}
                            triggerArrayHelpers={triggerArrayHelpers}
                            monitor={formikToMonitor(values)}
                            monitorValues={values}
                            touched={touched}
                            setFlyout={this.props.setFlyout}
                            triggers={_.get(formikToMonitor(values), 'triggers', [])}
                            triggerValues={values}
                            isDarkMode={this.props.isDarkMode}
                            httpClient={httpClient}
                            notifications={notifications}
                            notificationService={notificationService}
                            plugins={plugins}
                            isServerless={this.props.isServerless}
                          />
                        )}
                      </FieldArray>
                    )}

                    <EuiSpacer />
                    <EuiFlexGroup alignItems="center" justifyContent="flexEnd">
                      <EuiFlexItem grow={false}>
                        <EuiSmallButtonEmpty onClick={this.onCancel}>Cancel</EuiSmallButtonEmpty>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiSmallButton fill onClick={handleSubmit} isLoading={isSubmitting}>
                          {edit ? 'Save' : 'Create'}
                        </EuiSmallButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </Fragment>
                )}

                <SubmitErrorHandler
                  errors={errors}
                  isSubmitting={isSubmitting}
                  isValid={isValid}
                  onSubmitError={() =>
                    notifications.toasts.addDanger({
                      title: `Failed to ${edit ? 'update' : 'create'} the monitor`,
                      text: 'Fix all highlighted error(s) before continuing.',
                    })
                  }
                />

                {createModalOpen &&
                  getPerformanceModal({
                    edit: edit,
                    onClose: () => {
                      this.state.formikBag.setSubmitting(false);
                      this.setState({
                        createModalOpen: false,
                        formikBag: undefined,
                      });
                    },
                    onSubmit: () => {
                      this.onSubmit(values, this.state.formikBag);
                      this.setState({ createModalOpen: false });
                    },
                    values: values,
                  })}
              </Fragment>
            );
          }}
        </Formik>
      </div>
    );
  }
}
