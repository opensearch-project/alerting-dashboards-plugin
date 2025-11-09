/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Fragment } from 'react';
import _ from 'lodash';
import { Formik, FieldArray } from 'formik';
import {
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import moment from 'moment-timezone';
import ConfigureActionsPpl from '../../ConfigureActions/ConfigureActionsPpl';
import DefineTriggerPpl from '../../DefineTrigger/DefineTriggerPpl';
import { SubmitErrorHandler } from '../../../../../utils/SubmitErrorHandler';
import { backendErrorNotification } from '../../../../../utils/helpers';
import { getTimeZone } from '../../../utils/helper';
import { getDataSourceQueryObj } from '../../../../utils/helpers';

const DEFAULT_TRIGGER = {
  id: undefined,
  name: '',
  severity: 'info',
  type: 'number_of_results',
  mode: 'result_set',
  num_results_condition: '>=',
  num_results_value: 1,
  throttle_enabled: false,
  suppress: { value: 10, unit: 'minutes' },
  expires: { value: 24, unit: 'hours' },
  actions: [],
};

export default class CreateTriggerPpl extends Component {
  constructor(props) {
    super(props);

    const initialValues = _.cloneDeep(DEFAULT_TRIGGER);

    this.state = {
      executeResponse: null,
      initialValues,
    };
  }

  componentDidMount() {
    this.onRunExecute(this.props.monitorValues);
  }

  onRunExecute = (formikValuesArg, triggers = []) => {
    const { httpClient, monitor, notifications } = this.props;
    const formikValues = formikValuesArg || this.props.monitorValues;

    const pplQuery = formikValues?.pplQuery || monitor?.ppl_monitor?.query || monitor?.query || '';

    const dataSourceQuery = getDataSourceQueryObj();
    httpClient
      .post('/_plugins/_ppl', {
        body: JSON.stringify({ query: pplQuery }),
        query: dataSourceQuery?.query,
      })
      .then((resp) => {
        if (resp.ok) {
          const now = Date.now();
          const wrapped = {
            ok: true,
            period_start: now - 60 * 60 * 1000,
            period_end: now,
            input_results: { results: [resp.resp] },
            error: null,
          };
          this.setState({ executeResponse: wrapped });
        } else {
          backendErrorNotification(notifications, 'preview', 'query', resp.resp);
        }
      })
      .catch((err) => console.log('err:', err));
  };

  renderSuccessCallOut = () => {
    const { monitor, showSuccessCallOut, onCloseTrigger } = this.props;
    if (!showSuccessCallOut) return null;
    return (
      <Fragment>
        <EuiCallOut
          title={
            <span>
              Monitor <strong>{monitor.name}</strong> has been created. Add a trigger to this
              monitor or{' '}
              <EuiLink style={{ textDecoration: 'underline' }} onClick={onCloseTrigger}>
                cancel
              </EuiLink>{' '}
              to view monitor.
            </span>
          }
          color="success"
          iconType="alert"
          size="s"
        />
        <EuiSpacer size="s" />
      </Fragment>
    );
  };

  getTriggerContext = (executeResponse, monitor, values) => ({
    periodStart: moment
      .utc(_.get(executeResponse, 'period_start', Date.now()))
      .tz(getTimeZone())
      .format(),
    periodEnd: moment
      .utc(_.get(executeResponse, 'period_end', Date.now()))
      .tz(getTimeZone())
      .format(),
    results: [_.get(executeResponse, 'input_results.results[0]')].filter(Boolean),
    trigger: values,
    alert: null,
    error: null,
    monitor,
  });

  onSubmit = (values, formikBag) => {
    const trigger = {
      ...values,
      throttle_minutes: values.throttle_enabled ? values.suppress.value : 0,
      expires_minutes: values.expires.value,
    };
    this.props.onSave(trigger, formikBag);
  };

  render() {
    const {
      monitor,
      onCloseTrigger,
      setFlyout,
      httpClient,
      notifications,
      notificationService,
      plugins,
    } = this.props;
    const { initialValues, executeResponse } = this.state;

    return (
      <div style={{ padding: '25px 50px' }}>
        {this.renderSuccessCallOut()}
        <Formik initialValues={initialValues} onSubmit={this.onSubmit} validateOnChange={false}>
          {({ values, handleSubmit, isSubmitting, errors, isValid }) => (
            <Fragment>
              <EuiTitle size="l">
                <h1>{this.props.edit ? 'Edit' : 'Create'} trigger</h1>
              </EuiTitle>
              <EuiSpacer />

              <DefineTriggerPpl
                context={this.getTriggerContext(executeResponse, monitor, values)}
                executeResponse={executeResponse}
                monitor={monitor}
                monitorValues={values}
                onRun={(fv) => this.onRunExecute(fv || values)}
                setFlyout={setFlyout}
                triggers={monitor.triggers}
                triggerValues={values}
                isDarkMode={this.props.isDarkMode}
                httpClient={httpClient}
                notifications={notifications}
                notificationService={notificationService}
                plugins={plugins}
              />

              <EuiSpacer />
              <FieldArray name="actions" validateOnChange>
                {(arrayHelpers) => (
                  <ConfigureActionsPpl
                    arrayHelpers={arrayHelpers}
                    context={this.getTriggerContext(executeResponse, monitor, values)}
                    httpClient={httpClient}
                    setFlyout={setFlyout}
                    values={values}
                    notifications={notifications}
                    notificationService={notificationService}
                    plugins={plugins}
                  />
                )}
              </FieldArray>
              <EuiSpacer />
              <EuiFlexGroup alignItems="center" justifyContent="flexEnd">
                <EuiFlexItem grow={false}>
                  <EuiSmallButtonEmpty onClick={onCloseTrigger}>Cancel</EuiSmallButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiSmallButton onClick={handleSubmit} isLoading={isSubmitting} fill>
                    {this.props.edit ? 'Update' : 'Create'}
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
              <SubmitErrorHandler
                errors={errors}
                isSubmitting={isSubmitting}
                isValid={isValid}
                onSubmitError={() =>
                  notifications.toasts.addDanger({
                    title: `Failed to ${this.props.edit ? 'update' : 'create'} the trigger`,
                    text: 'Fix all highlighted error(s) before continuing.',
                  })
                }
              />
            </Fragment>
          )}
        </Formik>
      </div>
    );
  }
}
