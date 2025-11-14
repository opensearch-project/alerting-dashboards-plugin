/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Fragment } from 'react';
import _ from 'lodash';
import moment from 'moment-timezone';
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
import 'brace/theme/github';
import 'brace/mode/json';
import 'brace/mode/plain_text';
import 'brace/snippets/javascript';
import 'brace/ext/language_tools';
import ConfigureActions from '../../ConfigureActions';
import DefineTrigger from '../../DefineTrigger';
import monitorToFormik from '../../../../CreateMonitor/containers/CreateMonitor/utils/monitorToFormik';
import { buildRequest } from '../../../../CreateMonitor/containers/DefineMonitor/utils/searchRequests';
import { formikToTrigger, formikToTriggerUiMetadata } from '../utils/formikToTrigger';
import { triggerToFormik } from '../utils/triggerToFormik';
import { FORMIK_INITIAL_TRIGGER_VALUES, TRIGGER_TYPE } from '../utils/constants';
import { SEARCH_TYPE } from '../../../../../utils/constants';
import { SubmitErrorHandler } from '../../../../../utils/SubmitErrorHandler';
import { backendErrorNotification } from '../../../../../utils/helpers';
import DefineBucketLevelTrigger from '../../DefineBucketLevelTrigger';
import { getPathsPerDataType } from '../../../../CreateMonitor/containers/DefineMonitor/utils/mappings';
import { MONITOR_TYPE } from '../../../../../utils/constants';
import { buildClusterMetricsRequest } from '../../../../CreateMonitor/components/ClusterMetricsMonitor/utils/clusterMetricsMonitorHelpers';
import { getTimeZone } from '../../../utils/helper';
import { getDataSourceQueryObj } from '../../../../utils/helpers';

/** Normalize PPL preview -> 1h shape that TriggerGraph/TriggerQuery expect */
const build1hSeriesFromTotal = (pplResp, now = Date.now()) => {
  const HOUR = 60 * 60 * 1000;
  const total = Number(pplResp?.total ?? pplResp?.datarows?.length ?? 0) || 0;
  const buckets = [{ key: now - HOUR, doc_count: total }];
  return {
    hits: { total: { value: total } },
    aggregations: { ppl_histogram: { buckets } },
    ppl_raw: pplResp,
  };
};

export const DEFAULT_CLOSED_STATES = {
  WHEN: false,
  OF_FIELD: false,
  THRESHOLD: false,
  OVER: false,
  FOR_THE_LAST: false,
  WHERE: false,
};

export default class CreateTrigger extends Component {
  constructor(props) {
    super(props);

    const useTriggerToFormik = this.props.edit && this.props.triggerToEdit;
    const initialValues = useTriggerToFormik
      ? triggerToFormik(this.props.triggerToEdit, this.props.monitor)
      : _.cloneDeep(FORMIK_INITIAL_TRIGGER_VALUES);

    this.state = {
      triggerResponse: null,
      executeResponse: null,
      initialValues,
      dataTypes: {},
      openedStates: DEFAULT_CLOSED_STATES,
      madeChanges: false,
    };
  }

  componentDidMount() {
    this.onRunExecute(monitorToFormik(this.props.monitor));
    this.onQueryMappings();
  }

  componentWillUnmount() {
    this.props.setFlyout(null);
  }

  onCreate = (trigger, triggerMetadata, { setSubmitting, setErrors }) => {
    const { monitor, updateMonitor, onCloseTrigger } = this.props;
    const { ui_metadata: uiMetadata, triggers } = monitor;
    const updatedTriggers = [trigger].concat(triggers);
    const updatedUiMetadata = {
      ...uiMetadata,
      triggers: { ...uiMetadata.triggers, ...triggerMetadata },
    };
    const actionKeywords = ['create', 'trigger'];
    updateMonitor({ triggers: updatedTriggers, ui_metadata: updatedUiMetadata }, actionKeywords)
      .then((res) => {
        setSubmitting(false);
        if (res.ok) {
          onCloseTrigger();
        }
      })
      .catch((err) => {
        console.error(err);
        setSubmitting(false);
      });
  };

  onEdit = (trigger, triggerMetadata, { setSubmitting }) => {
    const { monitor, updateMonitor, onCloseTrigger, triggerToEdit } = this.props;
    const { ui_metadata: uiMetadata = {}, triggers, monitor_type } = monitor;
    const triggerType =
      monitor_type === MONITOR_TYPE.BUCKET_LEVEL ? TRIGGER_TYPE.BUCKET_LEVEL : TRIGGER_TYPE.QUERY_LEVEL;
    const { name } = triggerToEdit[triggerType];
    const updatedTriggersMetadata = _.cloneDeep(uiMetadata.triggers || {});
    delete updatedTriggersMetadata[name];
    const updatedUiMetadata = { ...uiMetadata, triggers: { ...updatedTriggersMetadata, ...triggerMetadata } };

    const findTriggerName = (element) => element[triggerType].name;
    const indexToUpdate = _.findIndex(triggers, findTriggerName);
    const updatedTriggers = triggers.slice();
    updatedTriggers.splice(indexToUpdate, 1, trigger);

    const actionKeywords = ['update', 'trigger'];
    updateMonitor({ triggers: updatedTriggers, ui_metadata: updatedUiMetadata }, actionKeywords)
      .then((res) => {
        setSubmitting(false);
        if (res.ok) onCloseTrigger();
      })
      .catch((err) => {
        console.error(err);
        setSubmitting(false);
      });
  };

  onRunExecute = (formikValuesArg, triggers = []) => {
    const { httpClient, monitor, notifications } = this.props;
    const formikValues = formikValuesArg || monitorToFormik(monitor);
    const searchType = formikValues.searchType;

    const isPPL =
      monitor?.query_language === 'ppl' ||
      formikValues?.monitor_mode === 'ppl' ||
      !!monitor?.ppl_monitor ||
      !!formikValues?.pplQuery;

    // PPL PREVIEW: POST /_plugins/_ppl with { query }
    if (isPPL) {
      const pplQuery =
        formikValues?.pplQuery ||
        monitor?.ppl_monitor?.query ||
        monitor?.query ||
        '';

      const dataSourceQuery = getDataSourceQueryObj();
      httpClient
        .post('/_plugins/_ppl', {
          body: JSON.stringify({ query: pplQuery }),
          query: dataSourceQuery?.query,
        })
        .then((resp) => {
          if (resp.ok) {
            const now = Date.now();
            const normalized = build1hSeriesFromTotal(resp.resp, now);
            const wrapped = {
              ok: true,
              period_start: now - 60 * 60 * 1000, // last 1h
              period_end: now,                    // now
              input_results: { results: [normalized] },
              error: null,
            };
            this.setState({ executeResponse: wrapped });
          } else {
            backendErrorNotification(notifications, 'preview', 'query', resp.resp);
          }
        })
        .catch((err) => console.log('err:', err));
      return;
    }

    // Non-PPL fallback execute
    const monitorToExecute = _.cloneDeep(monitor);
    _.set(monitorToExecute, 'triggers', triggers);

    switch (searchType) {
      case SEARCH_TYPE.QUERY:
      case SEARCH_TYPE.GRAPH: {
        const searchRequest = buildRequest(formikValues);
        _.set(monitorToExecute, 'inputs[0].search', searchRequest);
        break;
      }
      case SEARCH_TYPE.CLUSTER_METRICS: {
        const clusterMetricsRequest = buildClusterMetricsRequest(formikValues);
        _.set(monitorToExecute, 'inputs[0].uri', clusterMetricsRequest);
        break;
      }
      default:
        break;
    }
    const dataSourceQuery = getDataSourceQueryObj();
    httpClient
      .post('/api/alerting/monitors/_execute', {
        body: JSON.stringify(monitorToExecute),
        query: dataSourceQuery?.query,
      })
      .then((resp) => {
        if (resp.ok) this.setState({ executeResponse: resp.resp });
        else backendErrorNotification(notifications, 'run', 'trigger', resp.resp);
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
              Monitor <strong>{monitor.name}</strong> has been created. Add a trigger to this monitor or{' '}
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

  onSubmit = (values, formikBag) => {
    const monitorUiMetadata = _.get(this.props.monitor, 'ui_metadata', {});
    const trigger = formikToTrigger(values, monitorUiMetadata);
    const triggerMetadata = formikToTriggerUiMetadata(values, monitorUiMetadata);
    if (this.props.edit) this.onEdit(trigger, triggerMetadata, formikBag);
    else this.onCreate(trigger, triggerMetadata, formikBag);
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
    trigger: formikToTrigger(values, _.get(this.props.monitor, 'ui_metadata', {})),
    alert: null,
    error: null,
    monitor,
  });

  async queryMappings(index) {
    if (!index.length) return {};
    try {
      const dataSourceQuery = getDataSourceQueryObj();
      const response = await this.props.httpClient.post('/api/alerting/_mappings', {
        body: JSON.stringify({ index }),
        query: dataSourceQuery?.query,
      });
      return response.ok ? response.resp : {};
    } catch (err) {
      throw err;
    }
  }

  async onQueryMappings() {
    const indices = this.props.monitor.inputs[0].search?.indices || [];
    try {
      const mappings = await this.queryMappings(indices);
      const dataTypes = getPathsPerDataType(mappings);
      this.setState({ dataTypes });
    } catch (err) {
      console.error('There was an error getting mappings for query', err);
    }
  }

  render() {
    const {
      monitor,
      onCloseTrigger,
      setFlyout,
      edit,
      httpClient,
      notifications,
      notificationService,
      plugins,
    } = this.props;
    const { dataTypes, initialValues, executeResponse } = this.state;

    return (
      <div style={{ padding: '25px 50px' }}>
        {this.renderSuccessCallOut()}
        <Formik initialValues={initialValues} onSubmit={this.onSubmit} validateOnChange={false}>
          {({ values, handleSubmit, isSubmitting, errors, isValid }) => (
            <Fragment>
              <EuiTitle size="l">
                <h1>{edit ? 'Edit' : 'Create'} trigger</h1>
              </EuiTitle>
              <EuiSpacer />

              <DefineTrigger
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
                  <ConfigureActions
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
                    {edit ? 'Update' : 'Create'}
                  </EuiSmallButton>
                </EuiFlexItem>
              </EuiFlexGroup>
              <SubmitErrorHandler
                errors={errors}
                isSubmitting={isSubmitting}
                isValid={isValid}
                onSubmitError={() =>
                  this.props.notifications.toasts.addDanger({
                    title: `Failed to ${edit ? 'update' : 'create'} the trigger`,
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
