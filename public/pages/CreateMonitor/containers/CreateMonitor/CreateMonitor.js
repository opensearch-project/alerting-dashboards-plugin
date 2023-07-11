/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Fragment } from 'react';
import _ from 'lodash';
import { FieldArray, Formik } from 'formik';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import DefineMonitor from '../DefineMonitor';
import { FORMIK_INITIAL_VALUES } from './utils/constants';
import { formikToMonitor } from './utils/formikToMonitor';
import { SEARCH_TYPE } from '../../../../utils/constants';
import { SubmitErrorHandler } from '../../../../utils/SubmitErrorHandler';
import MonitorDetails from '../MonitorDetails';
import ConfigureTriggers from '../../../CreateTrigger/containers/ConfigureTriggers';
import { triggerToFormik } from '../../../CreateTrigger/containers/CreateTrigger/utils/triggerToFormik';
import WorkflowDetails from '../WorkflowDetails/WorkflowDetails';
import { getInitialValues, getPlugins, submit } from './utils/helpers';

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
    let triggerToEdit;

    if (edit && monitorToEdit) {
      triggerToEdit = triggerToFormik(_.get(monitorToEdit, 'triggers', []), monitorToEdit);
    }

    this.state = {
      plugins: [],
      response: null,
      performanceResponse: null,
      initialValues,
      triggerToEdit,
    };

    this.onCancel = this.onCancel.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
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

  onSubmit(values, formikBag) {
    const { edit, history, updateMonitor, notifications, httpClient } = this.props;
    const { triggerToEdit } = this.state;

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
    const { initialValues, plugins } = this.state;

    return (
      <div style={{ padding: '25px 50px' }}>
        <Formik initialValues={initialValues} onSubmit={this.onSubmit} validateOnChange={false}>
          {({ values, errors, handleSubmit, isSubmitting, isValid, touched }) => {
            return (
              <Fragment>
                <EuiTitle size="l">
                  <h1>{edit ? 'Edit' : 'Create'} monitor</h1>
                </EuiTitle>
                <EuiSpacer />

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
                />

                {values.preventVisualEditor ? null : (
                  <Fragment>
                    <EuiSpacer />

                    <WorkflowDetails
                      isDarkMode={isDarkMode}
                      values={values}
                      httpClient={httpClient}
                      errors={errors}
                    />

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
                          />
                          <EuiSpacer />
                        </div>
                      )}

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
                        />
                      )}
                    </FieldArray>

                    <EuiSpacer />
                    <EuiFlexGroup alignItems="center" justifyContent="flexEnd">
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty onClick={this.onCancel}>Cancel</EuiButtonEmpty>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButton fill onClick={handleSubmit} isLoading={isSubmitting}>
                          {edit ? 'Update' : 'Create'}
                        </EuiButton>
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
              </Fragment>
            );
          }}
        </Formik>
      </div>
    );
  }
}
