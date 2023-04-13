/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Fragment } from 'react';
import _ from 'lodash';
import queryString from 'query-string';
import { FieldArray, Formik } from 'formik';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTitle,
  EuiText,
} from '@elastic/eui';
import DefineMonitor from '../DefineMonitor';
import { FORMIK_INITIAL_VALUES } from './utils/constants';
import monitorToFormik from './utils/monitorToFormik';
import { formikToMonitor } from './utils/formikToMonitor';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { initializeFromQueryParams } from './utils/monitorQueryParams';
import { SubmitErrorHandler } from '../../../../utils/SubmitErrorHandler';
import { backendErrorNotification } from '../../../../utils/helpers';
import MonitorDetails from '../MonitorDetails';
import ConfigureTriggers from '../../../CreateTrigger/containers/ConfigureTriggers';
import {
  formikToTrigger,
  formikToTriggerUiMetadata,
} from '../../../CreateTrigger/containers/CreateTrigger/utils/formikToTrigger';
import { triggerToFormik } from '../../../CreateTrigger/containers/CreateTrigger/utils/triggerToFormik';
import {
  TRIGGER_TYPE,
  FORMIK_INITIAL_TRIGGER_VALUES,
} from '../../../CreateTrigger/containers/CreateTrigger/utils/constants';
import { FORMIK_INITIAL_AGG_VALUES } from '../CreateMonitor/utils/constants';
import { unitToLabel } from '../../../CreateMonitor/components/Schedule/Frequencies/Interval';
import EnhancedAccordion from '../../../../components/FeatureAnywhereContextMenu/EnhancedAccordion';
import { getInitialActionValues } from '../../../CreateTrigger/components/AddActionButton/utils';
import './styles.scss';
import { createSavedObjectAssociation } from '../../../../components/FeatureAnywhereContextMenu/AddAlertingMonitor/utils';

export default class CreateMonitor extends Component {
  static defaultProps = {
    edit: false,
    monitorToEdit: null,
    detectorId: null,
    updateMonitor: () => {},
    flyoutMode: null,
    defaultName: '',
    defaultIndex: undefined,
    isDefaultTriggerEnabled: false,
    defaultTimeField: '',
    isDarkMode: false,
    isDefaultMetricsEnabled: false,
    isDefaultNotificationEnabled: false,
    onSubmitCallback: null,
    onPreSubmitCallback: null,
    onPostSubmitCallback: null,
    visualizationId: '',
  };

  constructor(props) {
    super(props);

    //pre-populate some of values if query params exists.
    let initialValues = _.mergeWith(
      {},
      _.cloneDeep(FORMIK_INITIAL_VALUES),
      initializeFromQueryParams(queryString.parse(this.props.location.search)),
      (initialValue, queryValue) => (_.isEmpty(queryValue) ? initialValue : queryValue)
    );

    if (props.defaultName) {
      initialValues.name = props.defaultName;
    }

    if (props.defaultIndex) {
      initialValues.index = props.defaultIndex;
    }

    if (props.defaultTimeField) {
      initialValues.timeField = props.defaultTimeField;
    }

    this.state = {
      plugins: [],
      response: null,
      performanceResponse: null,
      accordionsOpen: {},
      Section: props.flyoutMode
        ? (props) => <EnhancedAccordion {...props} />
        : ({ children }) => <>{children}</>,
    };

    if (this.props.edit && this.props.monitorToEdit) {
      const triggers = triggerToFormik(
        _.get(this.props.monitorToEdit, 'triggers', []),
        this.props.monitorToEdit
      );
      _.set(this.state, 'triggerToEdit', triggers);
      initialValues = {
        ...monitorToFormik(this.props.monitorToEdit),
        triggerDefinitions: triggers.triggerDefinitions,
      };
    }

    // Adds an initial trigger if needed
    if (props.isDefaultTriggerEnabled) {
      const values = _.cloneDeep(FORMIK_INITIAL_TRIGGER_VALUES);
      values.name = 'Trigger 1';
      initialValues.triggerDefinitions = [values];

      // Adds an initial notification if needed
      if (props.isDefaultNotificationEnabled) {
        const monitorType = initialValues.monitor_type;
        initialValues.triggerDefinitions[0].actions = [
          getInitialActionValues({ monitorType, numOfActions: 0, flyoutMode: props.flyoutMode }),
        ];
      }
    }

    // Add default metrics
    if (props.isDefaultMetricsEnabled) {
      initialValues.aggregations = [FORMIK_INITIAL_AGG_VALUES];
    }

    _.set(this.state, 'initialValues', initialValues);

    this.onCancel = this.onCancel.bind(this);
    this.onCreate = this.onCreate.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onUpdate = this.onUpdate.bind(this);
    this.getPlugins = this.getPlugins.bind(this);
    this.handleCreateMonitorEvent = this.handleCreateMonitorEvent.bind(this);
    this.formikRef = React.createRef();
  }

  componentDidMount() {
    this.getPlugins();
    this.setSchedule();

    document.addEventListener('createMonitor', () => {
      this.handleCreateMonitorEvent();
    });
  }

  handleCreateMonitorEvent() {
    this.formikRef.current.submitForm();
  }

  async getPlugins() {
    const { httpClient } = this.props;
    try {
      const pluginsResponse = await httpClient.get('../api/alerting/_plugins');
      if (pluginsResponse.ok) {
        this.setState({ plugins: pluginsResponse.resp.map((plugin) => plugin.component) });
      } else {
        console.error('There was a problem getting plugins list');
      }
    } catch (e) {
      console.error('There was a problem getting plugins list', e);
    }
  }

  resetResponse() {
    this.setState({ response: null, performanceResponse: null });
  }

  onCancel() {
    if (this.props.edit) this.props.history.goBack();
    else this.props.history.push('/monitors');
  }

  async onCreate(monitor, { setSubmitting, setErrors }) {
    const { httpClient, notifications, onPostSubmitCallback } = this.props;
    let isSuccessful = false;

    try {
      const resp = await httpClient.post('../api/alerting/monitors', {
        body: JSON.stringify(monitor),
      });
      setSubmitting(false);
      const {
        ok,
        resp: { _id },
      } = resp;
      if (ok) {
        notifications.toasts.addSuccess(`Monitor "${monitor.name}" successfully created.`);
        this.props.history.push(`/monitors/${_id}`);
        isSuccessful = true;

        createSavedObjectAssociation(_id, this.props.visualizationId);
      } else {
        console.log('Failed to create:', resp);
        backendErrorNotification(notifications, 'create', 'monitor', resp.resp);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      // TODO: setErrors
    }

    if (onPostSubmitCallback) {
      onPostSubmitCallback(isSuccessful);
    }
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

  prepareTriggers = (trigger, triggerMetadata, monitor) => {
    const { edit } = this.props;
    const { ui_metadata: uiMetadata = {}, triggers, monitor_type } = monitor;

    let updatedTriggers;
    let updatedUiMetadata;

    if (edit) {
      updatedTriggers = _.isArray(trigger) ? trigger.concat(triggers) : [trigger].concat(triggers);
      updatedUiMetadata = {
        ...uiMetadata,
        triggers: { ...uiMetadata.triggers, ...triggerMetadata },
      };
    } else {
      const { triggerToEdit = [] } = this.state;

      let updatedTriggersMetadata = _.cloneDeep(uiMetadata.triggers || {});

      let triggerType;
      switch (monitor_type) {
        case MONITOR_TYPE.BUCKET_LEVEL:
          triggerType = TRIGGER_TYPE.BUCKET_LEVEL;
          break;
        case MONITOR_TYPE.DOC_LEVEL:
          triggerType = TRIGGER_TYPE.DOC_LEVEL;
          break;
        default:
          triggerType = TRIGGER_TYPE.QUERY_LEVEL;
          break;
      }

      if (_.isArray(triggerToEdit)) {
        const names = triggerToEdit.map((entry) => _.get(entry, `${triggerType}.name`));
        names.forEach((name) => delete updatedTriggersMetadata[name]);
        updatedTriggers = _.cloneDeep(trigger);
      } else {
        const { name } = _.get(triggerToEdit, `${triggerType}`);
        delete updatedTriggersMetadata[name];

        const findTriggerName = (element) => {
          return name === _.get(element, `${triggerType}.name`);
        };

        const indexToUpdate = _.findIndex(triggers, findTriggerName);
        updatedTriggers = triggers.slice();
        updatedTriggers.splice(indexToUpdate, 1, trigger);
      }

      updatedUiMetadata = {
        ...uiMetadata,
        triggers: { ...updatedTriggersMetadata, ...triggerMetadata },
      };
    }

    return { triggers: updatedTriggers, ui_metadata: updatedUiMetadata };
  };

  async onUpdate(monitor, { setSubmitting, setErrors }) {
    const { updateMonitor, notifications } = this.props;
    const updatedMonitor = _.cloneDeep(monitor);
    try {
      const resp = await updateMonitor(updatedMonitor);
      setSubmitting(false);
      const { ok, id } = resp;
      if (ok) {
        notifications.toasts.addSuccess(`Monitor "${monitor.name}" successfully updated.`);
        this.props.history.push(`/monitors/${id}`);
      } else {
        console.log('Failed to update:', resp);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      // TODO: setErrors
    }
  }

  onSubmit(values, formikBag) {
    const { edit, onPreSubmitCallback } = this.props;
    let monitor = formikToMonitor(values);

    if (onPreSubmitCallback) {
      onPreSubmitCallback();
    }

    if (!_.isEmpty(_.get(values, 'triggerDefinitions'))) {
      const monitorUiMetadata = _.get(monitor, 'ui_metadata', {});
      const triggerMetadata = formikToTriggerUiMetadata(values, monitorUiMetadata);
      const triggers = this.prepareTriggers(
        formikToTrigger(values, monitorUiMetadata),
        triggerMetadata,
        monitor
      );
      monitor = { ...monitor, ...triggers };
    }

    if (edit) {
      this.onUpdate(monitor, formikBag);
    } else {
      this.onCreate(monitor, formikBag);
    }
  }

  onCloseTrigger = () => {
    this.props.history.push({ ...this.props.location, search: '' });
  };

  onAccordionToggle = (key) => {
    const accordionsOpen = { ...this.state.accordionsOpen };
    accordionsOpen[key] = !accordionsOpen[key];
    this.setState({ accordionsOpen });
  };

  componentWillUnmount() {
    this.props.setFlyout(null);

    document.removeEventListener('createMonitor', () => this.handleCreateMonitorEvent());
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
      flyoutMode,
    } = this.props;
    const { initialValues, plugins, accordionsOpen, Section } = this.state;

    return (
      <div style={flyoutMode ? {} : { padding: '25px 50px' }} className="create-monitor">
        <Formik
          initialValues={initialValues}
          onSubmit={this.onSubmit}
          validateOnChange={false}
          innerRef={this.formikRef}
        >
          {({ values, errors, handleSubmit, isSubmitting, isValid, touched }) => {
            const isAd = values.searchType === SEARCH_TYPE.AD;

            return (
              <Fragment>
                {!flyoutMode && (
                  <>
                    <EuiTitle size="l">
                      <h1>{edit ? 'Edit' : 'Create'} monitor</h1>
                    </EuiTitle>
                    <EuiSpacer />
                  </>
                )}
                <Section
                  {...{
                    id: 'monitorDetails',
                    isOpen: accordionsOpen.monitorDetails,
                    onToggle: () => this.onAccordionToggle('monitorDetails'),
                    title: values.name,
                    subTitle: flyoutMode && values.frequency === 'interval' && (
                      <>
                        <EuiText size="m" className="create-monitor__frequency">
                          <p>
                            Runs every {values.period.interval}{' '}
                            <span>{unitToLabel[values.period.unit]}</span>
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
                    monitorToEdit={monitorToEdit}
                    plugins={plugins}
                    isAd={isAd}
                    detectorId={this.props.detectorId}
                    flyoutMode={flyoutMode}
                  />
                </Section>
                <EuiSpacer size={flyoutMode ? 'm' : 'l'} />
                {!isAd && (
                  <div>
                    <Section
                      {...{
                        id: 'advancedData',
                        isOpen: accordionsOpen.advancedData,
                        onToggle: this.onAccordionToggle,
                        onToggle: () => this.onAccordionToggle('advancedData'),
                        title: 'Advanced data source configuration',
                      }}
                    >
                      <DefineMonitor
                        values={values}
                        errors={errors}
                        touched={touched}
                        httpClient={httpClient}
                        location={location}
                        detectorId={this.props.detectorId}
                        notifications={notifications}
                        isDarkMode={isDarkMode}
                        flyoutMode={flyoutMode}
                      />
                    </Section>
                    {!flyoutMode && <EuiSpacer />}
                  </div>
                )}
                {flyoutMode && (
                  <>
                    <EuiSpacer size="xl" />
                    <EuiTitle size="s">
                      <h3>Triggers</h3>
                    </EuiTitle>
                    <EuiSpacer size="m" />
                  </>
                )}
                <FieldArray name={'triggerDefinitions'} validateOnChange={true}>
                  {(triggerArrayHelpers) => (
                    <ConfigureTriggers
                      edit={edit}
                      triggerArrayHelpers={triggerArrayHelpers}
                      monitor={formikToMonitor(values)}
                      monitorValues={values}
                      setFlyout={this.props.setFlyout}
                      triggers={_.get(formikToMonitor(values), 'triggers', [])}
                      triggerValues={values}
                      isDarkMode={this.props.isDarkMode}
                      httpClient={httpClient}
                      notifications={notifications}
                      notificationService={notificationService}
                      plugins={plugins}
                      flyoutMode={flyoutMode}
                    />
                  )}
                </FieldArray>
                {!flyoutMode && (
                  <>
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
                  </>
                )}
              </Fragment>
            );
          }}
        </Formik>
      </div>
    );
  }
}
