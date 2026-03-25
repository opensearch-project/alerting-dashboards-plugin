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
  EuiFormRow,
  EuiCheckbox,
  EuiFieldNumber,
  EuiSelect,
  EuiTextArea,
  EuiLink,
  EuiIconTip,
} from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel';
import DefineMonitor from '../DefineMonitor';
import { FORMIK_INITIAL_VALUES, LOOKBACK_WINDOW_MAX_MINUTES } from './utils/constants';
import { formikToMonitor } from './utils/formikToMonitor';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { SubmitErrorHandler } from '../../../../utils/SubmitErrorHandler';
import MonitorDetails from '../MonitorDetails';
import ConfigureTriggers from '../../../CreateTrigger/containers/ConfigureTriggers';
import ConfigureTriggersPpl from '../../../CreateTrigger/containers/ConfigureTriggers/ConfigureTriggersPpl';
import { triggerToFormik } from '../../../CreateTrigger/containers/CreateTrigger/utils/triggerToFormik';
import { triggerToFormikPpl } from '../../../CreateTrigger/containers/CreateTrigger/utils/triggerToFormikPpl';
import WorkflowDetails from '../WorkflowDetails/WorkflowDetails';
import { getInitialValues, getPlugins, submit } from './utils/helpers';
import { submitPPL } from './utils/pplAlertingHelpers';
import {
  getPerformanceModal,
  RECOMMENDED_DURATION,
} from '../../components/QueryPerformance/QueryPerformance';
import { isDataSourceChanged } from '../../../utils/helpers';
import { PageHeader } from '../../../../components/PageHeader/PageHeader';

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
      const isPpl =
        monitorToEdit?.monitor_type === MONITOR_TYPE.PPL || !!monitorToEdit?.ppl_monitor;
      if (isPpl) {
        const monitorLevelTriggers = _.get(monitorToEdit, 'ppl_monitor.triggers', []);
        const rootLevelTriggers = _.get(monitorToEdit, 'triggers', []);
        const rawTriggers =
          Array.isArray(monitorLevelTriggers) && monitorLevelTriggers.length
            ? monitorLevelTriggers
            : Array.isArray(rootLevelTriggers)
            ? rootLevelTriggers
            : [];
        const normalizedTriggers = rawTriggers.map((trigger) => triggerToFormikPpl(trigger));
        if (normalizedTriggers.length) {
          initialValues.triggerDefinitions = normalizedTriggers;
          triggerToEdit = normalizedTriggers[0];
        }
        initialValues.monitor_type = MONITOR_TYPE.PPL;
        initialValues.searchType = SEARCH_TYPE.PPL;
        initialValues.pplQuery =
          initialValues.pplQuery || _.get(monitorToEdit, 'ppl_monitor.query') || '';
      } else {
        triggerToEdit = triggerToFormik(_.get(monitorToEdit, 'triggers', []), monitorToEdit);
      }
    }

    this.state = {
      plugins: [],
      response: null,
      performanceResponse: null,
      initialValues,
      triggerToEdit,
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
      this.setState({
        initialValues: {
          ...this.state.initialValues,
          dataSourceId: this.props.landingDataSourceId,
        },
      });
    }
  }

  buildPplMonitorForTriggers = (values) => {
    const triggers = _.cloneDeep(values.triggerDefinitions || []);
    const rawIndices = Array.isArray(values.index)
      ? values.index.map((entry) => entry?.value || entry?.label).filter(Boolean)
      : [];
    const indices = rawIndices.length ? rawIndices : ['*'];
    return {
      name: values.name || '',
      type: 'monitor',
      monitor_type: values.monitor_type || MONITOR_TYPE.QUERY_LEVEL,
      enabled: true,
      schedule: { period: { interval: 1, unit: 'MINUTES' } },
      inputs: [{ search: { indices, query: { size: 0, query: { match_all: {} } } } }],
      ui_metadata: { search: { searchType: SEARCH_TYPE.PPL }, triggers: {} },
      triggers,
      ppl_monitor: { query: values.pplQuery || '', triggers },
    };
  };

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

    const useLB = values.useLookBackWindow !== undefined ? values.useLookBackWindow : true;
    const lbAmount = Number(values.lookBackAmount !== undefined ? values.lookBackAmount : 1);
    const lbUnit = values.lookBackUnit || 'hours';

    const lbMinutes =
      lbUnit === 'minutes' ? lbAmount : lbUnit === 'hours' ? lbAmount * 60 : lbAmount * 1440;
    const lbTooSmall = lbAmount !== '' && lbMinutes < 1;
    const lbTooLarge = lbAmount !== '' && lbMinutes > LOOKBACK_WINDOW_MAX_MINUTES;
    const lbError = lbTooSmall || lbTooLarge;

    const intervalAmount = Number(values.period?.interval ?? 1);
    const intervalUnit = values.period?.unit || 'MINUTES';
    const intervalMinutes =
      intervalUnit === 'MINUTES'
        ? intervalAmount
        : intervalUnit === 'HOURS'
        ? intervalAmount * 60
        : intervalAmount * 1440;
    const intervalError = intervalAmount !== '' && intervalMinutes < 1;

    const noDateFields = dateFieldsError !== null && availableDateFields.length === 0;

    return (
      <ContentPanel title="Schedule" titleSize="s">
        <EuiFormRow label="Frequency" fullWidth style={{ maxWidth: '720px' }}>
          <EuiSelect
            data-test-subj="pplFrequency"
            options={[
              { value: 'interval', text: 'By interval' },
              { value: 'daily', text: 'Daily' },
              { value: 'weekly', text: 'Weekly' },
              { value: 'monthly', text: 'Monthly' },
              { value: 'cronExpression', text: 'Custom cron job' },
            ]}
            value={values.frequency}
            onChange={(e) => setFieldValue('frequency', e.target.value)}
            fullWidth
          />
        </EuiFormRow>

        {values.frequency === 'interval' && (
          <EuiFormRow
            label="Run every"
            fullWidth
            style={{ maxWidth: '720px' }}
            isInvalid={intervalError}
            error={intervalError ? 'Must be at least 1 minute' : undefined}
          >
            <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
              <EuiFlexItem>
                <EuiFieldNumber
                  data-test-subj="pplIntervalValue"
                  value={values.period?.interval === 0 ? '' : values.period?.interval ?? 1}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setFieldValue('period.interval', val);
                  }}
                  fullWidth
                  isInvalid={intervalError}
                />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiSelect
                  data-test-subj="pplIntervalUnit"
                  options={[
                    { value: 'MINUTES', text: 'minute(s)' },
                    { value: 'HOURS', text: 'hour(s)' },
                    { value: 'DAYS', text: 'day(s)' },
                  ]}
                  value={values.period?.unit || 'MINUTES'}
                  onChange={(e) => setFieldValue('period.unit', e.target.value)}
                  fullWidth
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>
        )}

        {values.frequency === 'cronExpression' && (
          <>
            <EuiFormRow label="Run every">
              <EuiTextArea
                data-test-subj="pplCronExpression"
                value={values.cronExpression || ''}
                onChange={(e) => setFieldValue('cronExpression', e.target.value)}
                placeholder="0 */1 * * *"
                rows={2}
              />
            </EuiFormRow>
            <EuiText size="xs" color="subdued">
              <EuiLink
                href="https://docs.opensearch.org/latest/observing-your-data/alerting/cron/"
                target="_blank"
                external
              >
                Use cron expressions for complex schedules
              </EuiLink>
            </EuiText>
            <EuiSpacer size="m" />
          </>
        )}

        <EuiFormRow>
          <EuiCheckbox
            id="useLookBackWindow"
            label={
              <span>
                Add look back window{' '}
                <EuiIconTip
                  type="iInCircle"
                  content="Look back window specifies how far back in time the monitor should query data during each execution."
                />
              </span>
            }
            checked={useLB && !noDateFields}
            onChange={(e) => {
              if (noDateFields) {
                setFieldValue('useLookBackWindow', false);
              } else {
                const checked = e.target.checked;
                setFieldValue('useLookBackWindow', checked);
                if (checked) {
                  if (values.lookBackAmount === undefined || values.lookBackAmount === null) {
                    setFieldValue('lookBackAmount', 1);
                  }
                  if (!values.lookBackUnit) {
                    setFieldValue('lookBackUnit', 'hours');
                  }
                }
              }
            }}
            data-test-subj="pplUseLookBack"
            disabled={noDateFields}
          />
        </EuiFormRow>

        {noDateFields && (
          <>
            <EuiSpacer size="s" />
            <EuiText size="xs" color="warning">
              <EuiIconTip type="alert" color="warning" /> Look back window requires a common
              timestamp field across all indices
            </EuiText>
            <EuiSpacer size="s" />
          </>
        )}

        {useLB && !noDateFields && (
          <>
            <EuiFormRow
              label="Look back from"
              fullWidth
              style={{ maxWidth: '720px' }}
              isInvalid={lbError}
              error={
                lbTooSmall
                  ? 'Must be at least 1 minute'
                  : lbTooLarge
                  ? 'Must be at most 7 days (10,080 minutes)'
                  : undefined
              }
            >
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem>
                  <EuiFieldNumber
                    data-test-subj="pplLookBackAmount"
                    value={lbAmount === 0 ? '' : lbAmount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setFieldValue('lookBackAmount', val);
                    }}
                    fullWidth
                    isInvalid={lbError}
                  />
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiSelect
                    data-test-subj="pplLookBackUnit"
                    options={[
                      { value: 'minutes', text: 'Minute(s) ago' },
                      { value: 'hours', text: 'Hour(s) ago' },
                      { value: 'days', text: 'Day(s) ago' },
                    ]}
                    value={lbUnit}
                    onChange={(e) => setFieldValue('lookBackUnit', e.target.value)}
                    fullWidth
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFormRow>

            <EuiFormRow
              label={
                <span>
                  Timestamp field{' '}
                  <EuiIconTip
                    type="iInCircle"
                    content="The date field used to filter data within the look back window."
                  />
                </span>
              }
              fullWidth
              style={{ maxWidth: '720px' }}
              helpText={dateFieldsLoading ? 'Detecting timestamp fields...' : undefined}
            >
              <EuiSelect
                data-test-subj="pplTimestampField"
                options={
                  availableDateFields.length > 0
                    ? availableDateFields.map((field) => ({ value: field, text: field }))
                    : [
                        {
                          value: values.timestampField || '@timestamp',
                          text: values.timestampField || '@timestamp',
                        },
                      ]
                }
                value={values.timestampField || '@timestamp'}
                onChange={(e) => setFieldValue('timestampField', e.target.value)}
                fullWidth
                isLoading={dateFieldsLoading}
              />
            </EuiFormRow>
          </>
        )}
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
