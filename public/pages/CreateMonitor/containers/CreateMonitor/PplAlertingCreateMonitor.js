/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, Fragment } from 'react';
import './CreateMonitor.scss';
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
  EuiPanel,
  EuiTitle,
  EuiButton,
  EuiCodeBlock,
  EuiEmptyPrompt,
  EuiCheckbox,
  EuiToolTip,
  EuiIconTip,
  EuiTextColor,
  EuiTextArea,
  EuiFieldText,
  EuiSelect,
  EuiFieldNumber,
  EuiAccordion,
  EuiHorizontalRule,
  EuiLink,
} from '@elastic/eui';
import CustomSteps from '../../components/CustomSteps';
import { FORMIK_INITIAL_VALUES, RECOMMENDED_DURATION } from './utils/constants';
import {
  getInitialValues,
  getPlugins,
  runPPLPreview,
  submitPPL,
  extractIndicesFromPPL,
  findCommonDateFields,
} from './utils/pplAlertingHelpers';
import { SubmitErrorHandler } from '../../../../utils/SubmitErrorHandler';
import ConfigureTriggersPpl from '../../../CreateTrigger/containers/ConfigureTriggers/ConfigureTriggersPpl';
import { triggerToFormikPpl } from '../../../CreateTrigger/containers/CreateTrigger/utils/triggerToFormikPpl';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { getPerformanceModal } from '../../components/QueryPerformance/QueryPerformance';
import { isDataSourceChanged } from '../../../utils/helpers';
import { PageHeader } from '../../../../components/PageHeader/PageHeader';
import { QueryEditor } from '../../components/QueryEditor';
import { AlertingDataTable } from '../../../../components/DataTable';
import { CoreContext } from '../../../../utils/CoreContext';
import { setDataSource, isPplAlertingEnabled } from '../../../../services';

class PplAlertingCreateMonitor extends Component {
  static contextType = CoreContext;
  formikRef = React.createRef();

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
    const initial = getInitialValues({ location, monitorToEdit, edit });
    const pplEnabled = isPplAlertingEnabled();
    // When editing, useLookBackWindow is set by pplAlertingMonitorToFormik based on monitor data
    // When creating new, default to true if not specified
    // Use explicit check to ensure false values from pplAlertingMonitorToFormik are preserved
    const useLookBackWindow =
      initial.useLookBackWindow !== undefined ? initial.useLookBackWindow : true;
    const initialValues = {
      ...initial,
      monitor_mode: initial.monitor_mode || (pplEnabled ? 'ppl' : 'legacy'),
      useLookBackWindow,
      // Only set default lookBackAmount/lookBackUnit if useLookBackWindow is true
      // When editing with null look back window, these should be undefined to prevent showing old values
      lookBackAmount:
        initial.lookBackAmount !== undefined
          ? initial.lookBackAmount
          : useLookBackWindow
          ? 1
          : undefined,
      lookBackUnit: initial.lookBackUnit || (useLookBackWindow ? 'hours' : undefined),
      timestampField: initial.timestampField || '@timestamp',
    };

    if (!pplEnabled) {
      this.redirectToLegacy();
    }

    let triggerToEdit;
    if (edit && monitorToEdit) {
      const monitorLevelTriggers = _.get(monitorToEdit, 'ppl_monitor.triggers', []);
      const rootLevelTriggers = _.get(monitorToEdit, 'triggers', []);
      const rawTriggers =
        Array.isArray(monitorLevelTriggers) && monitorLevelTriggers.length
          ? monitorLevelTriggers
          : Array.isArray(rootLevelTriggers)
          ? rootLevelTriggers
          : [];

      const normalizedTriggers = rawTriggers.map((trigger) => {
        const triggerFormik = triggerToFormikPpl(trigger);
        if (!Array.isArray(trigger?.actions)) {
          return triggerFormik;
        }
        return {
          ...triggerFormik,
          actions: _.cloneDeep(trigger.actions),
        };
      });

      if (normalizedTriggers.length) {
        initialValues.triggerDefinitions = normalizedTriggers;
        triggerToEdit = normalizedTriggers[0];
      }
    }

    this.state = {
      plugins: [],
      pluginsLoading: true,
      response: null,
      performanceResponse: null,
      initialValues,
      triggerToEdit,
      createModalOpen: false,
      formikBag: undefined,
      previewLoading: false,
      previewError: null,
      previewResult: null,
      previewQuery: '',
      previewOpen: false,
      indices: [],
      availableDateFields: [],
      dateFieldsLoading: false,
      dateFieldsError: null,
      queryLibOpen: false,
      showRaw: false,
    };
  }

  componentDidMount() {
    const { httpClient, landingDataSourceId } = this.props;

    if (!isPplAlertingEnabled()) {
      this.redirectToLegacy();
      return;
    }

    if (landingDataSourceId) {
      setDataSource({ dataSourceId: landingDataSourceId });
    } else {
      setDataSource({ dataSourceId: undefined });
    }

    this.fetchPlugins(httpClient);
    this.initializeIndices();
    this.detectInitialTimestampFields();
  }

  componentDidUpdate(prevProps) {
    if (isDataSourceChanged(prevProps, this.props) && this.formikRef.current) {
      const { landingDataSourceId } = this.props;
      setDataSource({ dataSourceId: landingDataSourceId });
      this.formikRef.current.setFieldValue('dataSourceId', landingDataSourceId, false);
      this.fetchPlugins(this.props.httpClient);
    }
  }

  fetchPlugins = async (httpClient) => {
    this.setState({ pluginsLoading: true });
    try {
      const newPlugins = await getPlugins(httpClient);
      this.setState({ plugins: newPlugins, pluginsLoading: false });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[CreateMonitor] Error fetching plugins:', error);
      this.setState({ pluginsLoading: false });
    }
  };

  redirectToLegacy = () => {
    const { history, location } = this.props;
    const params = new URLSearchParams(location.search);
    if (params.get('mode') !== 'classic') {
      params.set('mode', 'classic');
      history.replace({ ...location, search: params.toString() });
    }
  };

  initializeIndices = async () => {
    const { httpClient, landingDataSourceId } = this.props;
    const dsId = this.formikRef.current?.values?.dataSourceId || landingDataSourceId;

    try {
      const resp = await httpClient.get('/api/alerting/indices', {
        query: dsId ? { dataSourceId: dsId } : undefined,
      });
      this.setState({ indices: resp?.indices || [] });
    } catch (e) {
      this.setState({ indices: [] });
    }
  };

  detectInitialTimestampFields = () => {
    const initialPplQuery = this.formikRef.current?.values?.pplQuery;
    if (initialPplQuery) {
      this.detectTimestampFields(initialPplQuery);
    }
  };

  detectTimestampFields = async (pplQuery) => {
    const { httpClient, landingDataSourceId } = this.props;
    const indices = extractIndicesFromPPL(pplQuery);

    if (indices.length === 0) {
      this.setState({
        availableDateFields: [],
        dateFieldsError: 'No indices found in query',
        dateFieldsLoading: false,
      });
      if (this.formikRef.current) {
        this.formikRef.current.setFieldValue('useLookBackWindow', false, false);
      }
      return;
    }

    this.setState({ dateFieldsLoading: true, dateFieldsError: null });

    try {
      const dataSourceId = this.formikRef.current?.values?.dataSourceId || landingDataSourceId;

      const { commonDateFields, error } = await findCommonDateFields(
        httpClient,
        indices,
        dataSourceId
      );

      if (error) {
        this.setState({
          availableDateFields: [],
          dateFieldsError: error,
          dateFieldsLoading: false,
        });
        if (this.formikRef.current) {
          this.formikRef.current.setFieldValue('useLookBackWindow', false, false);
        }
        return;
      }

      if (commonDateFields.length === 0) {
        this.setState({
          availableDateFields: [],
          dateFieldsError: 'No common date fields found across all indices',
          dateFieldsLoading: false,
        });
        if (this.formikRef.current) {
          this.formikRef.current.setFieldValue('useLookBackWindow', false, false);
        }
        return;
      }

      const defaultField = commonDateFields[0];
      if (this.formikRef.current) {
        this.formikRef.current.setFieldValue('timestampField', defaultField, false);
      }

      this.setState({
        availableDateFields: commonDateFields,
        dateFieldsError: null,
        dateFieldsLoading: false,
      });
    } catch (err) {
      this.setState({
        availableDateFields: [],
        dateFieldsError: err?.message || 'Failed to detect timestamp fields',
        dateFieldsLoading: false,
      });
      if (this.formikRef.current) {
        this.formikRef.current.setFieldValue('useLookBackWindow', false, false);
      }
    }
  };

  debouncedDetectTimestampFields = _.debounce((pplQuery) => {
    this.detectTimestampFields(pplQuery);
  }, 1000);

  fetchInitialIndices = async () => {
    await this.initializeIndices();
  };

  runPreview = async (values) => {
    const { httpClient, landingDataSourceId } = this.props;
    this.setState({
      previewLoading: true,
      previewError: null,
      previewResult: null,
      previewQuery: '',
      previewOpen: true,
    });

    try {
      const data = await runPPLPreview(httpClient, {
        queryText: values.pplQuery || '',
        dataSourceId: values.dataSourceId || landingDataSourceId,
      });
      if (data?.ok === false) {
        this.setState({
          previewError: data.error || 'Incorrect data source or invalid query',
          previewLoading: false,
          previewOpen: true,
        });
        return;
      }
      this.setState({
        previewResult: data,
        previewQuery: values.pplQuery || '',
        previewLoading: false,
        previewOpen: true,
      });
    } catch (e) {
      this.setState({
        previewError: e?.body?.message || e?.message || 'Incorrect data source or invalid query',
        previewLoading: false,
        previewOpen: true,
      });
    }
  };

  evaluateSubmission = (values, formikBag) => {
    const { performanceResponse } = this.props;
    const { createModalOpen } = this.state;
    const monitorDurationCallout = _.get(performanceResponse, 'took') >= RECOMMENDED_DURATION;
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
  };

  buildMonitorForTriggers = (values) => {
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
      inputs: [
        {
          search: {
            indices,
            query: {
              size: 0,
              query: { match_all: {} },
            },
          },
        },
      ],
      ui_metadata: {
        search: { searchType: SEARCH_TYPE.QUERY },
        triggers: {},
      },
      triggers,
      ppl_monitor: {
        query: values.pplQuery || '',
        triggers,
      },
    };
  };

  onSubmit = (values, formikBag) => {
    const {
      edit,
      history,
      updateMonitor,
      notifications,
      httpClient,
      monitorToEdit,
      landingDataSourceId,
    } = this.props;

    submitPPL({
      values,
      formikBag,
      edit,
      monitorToEdit,
      history,
      notifications,
      httpClient,
      dataSourceId: values.dataSourceId || landingDataSourceId,
    });
  };

  onCancel = () => {
    if (this.props.edit) this.props.history.goBack();
    else this.props.history.push('/monitors');
  };

  handleClassicToggle = (setFieldValue) => {
    this.redirectToLegacy();
    setFieldValue('monitor_mode', 'legacy');
  };

  renderMonitorDetails = (values, setFieldValue) => (
    <>
      <EuiFormRow label="Monitor name" fullWidth style={{ marginLeft: '-6px', maxWidth: '720px' }}>
        <EuiFieldText
          data-test-subj="pplName"
          value={values.name}
          onChange={(e) => setFieldValue('name', e.target.value)}
          placeholder="Enter a monitor name"
          fullWidth
        />
      </EuiFormRow>

      <EuiFormRow
        label={
          <>
            <span className="euiFormLabel">Description</span>{' '}
            <EuiTextColor color="subdued">
              <span>- optional</span>
            </EuiTextColor>
          </>
        }
        fullWidth
        style={{ marginLeft: '-6px', maxWidth: '720px' }}
      >
        <>
          <EuiTextArea
            data-test-subj="pplDescription"
            value={values.description || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 500) {
                setFieldValue('description', value);
              }
            }}
            placeholder="Describe the monitor"
            fullWidth
          />
          {values.description && (
            <EuiText size="xs" color="subdued" style={{ marginTop: '4px' }}>
              {values.description.length} / 500 characters
            </EuiText>
          )}
        </>
      </EuiFormRow>

      {!this.props.edit && (
        <EuiFormRow>
          <EuiCheckbox
            id="useClassicMonitorsPplInline"
            label={
              <span>
                Use classic monitors{' '}
                <EuiToolTip content="Use pre-existing monitor types available in classic alerts.">
                  <EuiIconTip type="iInCircle" />
                </EuiToolTip>
              </span>
            }
            checked={values.monitor_mode === 'legacy'}
            onChange={() => this.handleClassicToggle(setFieldValue)}
            data-test-subj="useClassicCheckboxPplInline"
          />
        </EuiFormRow>
      )}
    </>
  );

  renderPplQuery = (values, setFieldValue) => (
    <>
      <EuiFlexGroup
        alignItems="center"
        justifyContent="spaceBetween"
        gutterSize="s"
        responsive={false}
      >
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiText>PPL</EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiIconTip
                type="iInCircle"
                content="Write queries in PPL."
                position="left"
                iconProps={{ style: { border: 'none', background: 'none' } }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            onClick={() => this.runPreview(values)}
            isLoading={this.state.previewLoading}
            data-test-subj="runPreview"
          >
            Run preview
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      <div data-test-subj="pplEditorMonaco">
        <QueryEditor
          value={values.pplQuery || ''}
          onChange={(text) => {
            if (text.length <= 10000) {
              setFieldValue('pplQuery', text);

              try {
                const services =
                  (this.context && (this.context.services || this.context)) || undefined;
                const queryString = services?.data?.query?.queryString;
                if (queryString) {
                  queryString.setQuery({
                    query: text,
                    language: 'PPL',
                  });
                }
              } catch (err) {
                // ignore
              }

              this.debouncedDetectTimestampFields(text);
            }
          }}
          services={this.context?.services || this.context}
          height={220}
          indices={this.state.indices}
        />
        {values.pplQuery && (
          <EuiText size="xs" color="subdued" style={{ marginTop: '4px' }}>
            {values.pplQuery.length} / 10,000 characters
          </EuiText>
        )}
      </div>

      <EuiSpacer size="m" />

      <EuiAccordion
        id="pplPreviewAccordion"
        buttonContent="Preview results"
        paddingSize="m"
        data-test-subj="pplPreviewAccordion"
        forceState={this.state.previewOpen ? 'open' : 'closed'}
        onToggle={(isOpen) => this.setState({ previewOpen: isOpen })}
      >
        <EuiPanel hasBorder paddingSize="l" data-test-subj="pplResultsPanel">
          <EuiTitle size="s">
            <h2>Results</h2>
          </EuiTitle>
          <EuiHorizontalRule margin="m" />
          {!this.state.previewResult && !this.state.previewError ? (
            <EuiEmptyPrompt
              iconType="editorCodeBlock"
              title={<h3>Run a query to view results</h3>}
              layout="vertical"
            />
          ) : this.state.previewError ? (
            <EuiCodeBlock isCopyable>{this.state.previewError}</EuiCodeBlock>
          ) : (
            <AlertingDataTable
              pplResponse={this.state.previewResult}
              isLoading={this.state.previewLoading}
              className="ppl-preview-table"
            />
          )}
        </EuiPanel>
      </EuiAccordion>
    </>
  );

  renderSchedule = (values, setFieldValue) => {
    const useLB = values.useLookBackWindow !== undefined ? values.useLookBackWindow : true;
    const lbAmount = Number(values.lookBackAmount !== undefined ? values.lookBackAmount : 1);
    const lbUnit = values.lookBackUnit || 'hours';
    const { availableDateFields, dateFieldsError, dateFieldsLoading } = this.state;

    const lbMinutes =
      lbUnit === 'minutes' ? lbAmount : lbUnit === 'hours' ? lbAmount * 60 : lbAmount * 1440;
    const lbError = lbAmount !== '' && lbMinutes < 1;

    const intervalAmount = Number(values.period?.interval ?? 1);
    const intervalUnit = values.period?.unit || 'MINUTES';
    const intervalMinutes =
      intervalUnit === 'MINUTES'
        ? intervalAmount
        : intervalUnit === 'HOURS'
        ? intervalAmount * 60
        : intervalAmount * 1440;
    const intervalError = intervalAmount !== '' && intervalMinutes < 1;

    const LookBackControls = (
      <>
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
            checked={useLB && !(dateFieldsError && availableDateFields.length === 0)}
            onChange={(e) => {
              if (dateFieldsError && availableDateFields.length === 0) {
                setFieldValue('useLookBackWindow', false);
              } else {
                const checked = e.target.checked;
                setFieldValue('useLookBackWindow', checked);
                // When checking the box, initialize lookBackAmount and lookBackUnit if they're undefined
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
            disabled={dateFieldsError !== null && availableDateFields.length === 0}
          />
        </EuiFormRow>

        {dateFieldsError && availableDateFields.length === 0 && (
          <>
            <EuiSpacer size="s" />
            <EuiText size="xs" color="warning">
              <EuiIconTip type="alert" color="warning" /> Look back window requires a common
              timestamp field across all indices
            </EuiText>
            <EuiSpacer size="s" />
          </>
        )}

        {useLB && !(dateFieldsError && availableDateFields.length === 0) && (
          <>
            <EuiFormRow
              label="look back from"
              fullWidth
              style={{ marginLeft: '-6px', maxWidth: '720px' }}
              isInvalid={lbError}
              error={lbError ? `Must be at least 1 minute` : undefined}
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
              style={{ marginLeft: '-6px', maxWidth: '720px' }}
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
      </>
    );

    return (
      <>
        <EuiFormRow label="Frequency" fullWidth style={{ marginLeft: '-6px', maxWidth: '720px' }}>
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
            style={{ marginLeft: '-6px', maxWidth: '720px' }}
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
        {LookBackControls}
      </>
    );
  };

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
    const {
      createModalOpen,
      initialValues,
      plugins,
      pluginsLoading,
      previewOpen,
      previewResult,
      previewError,
    } = this.state;

    return (
      <div className="ppl-alerting-create-monitor" style={{ padding: '16px' }}>
        <Formik
          innerRef={this.formikRef}
          initialValues={initialValues}
          onSubmit={this.evaluateSubmission}
          validateOnChange={true}
          enableReinitialize={false}
        >
          {({ values, errors, handleSubmit, isSubmitting, isValid, touched, setFieldValue }) => {
            if (values.monitor_mode === 'legacy') {
              this.redirectToLegacy();
              return null;
            }

            const ClassicToggleHeader = !edit ? (
              <EuiCheckbox
                id="useClassicMonitorsHeader"
                label={
                  <span>
                    Use classic monitors{' '}
                    <EuiToolTip content="Use pre-existing monitor types available in classic alerts.">
                      <EuiIconTip type="iInCircle" data-test-subj="classicInfoHeader" />
                    </EuiToolTip>
                  </span>
                }
                checked={values.monitor_mode === 'legacy'}
                onChange={() => this.handleClassicToggle(setFieldValue)}
                data-test-subj="useClassicCheckboxHeader"
              />
            ) : null;

            const monitorContextForTriggers = this.buildMonitorForTriggers(values);
            const triggerDefinitions = monitorContextForTriggers.triggers;

            return (
              <Fragment>
                <PageHeader>
                  <EuiText size="s">
                    <h1>{edit ? 'Edit' : 'Create'} monitor</h1>
                  </EuiText>
                  <EuiSpacer />
                  {ClassicToggleHeader && (
                    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                      <EuiFlexItem grow={false}>{ClassicToggleHeader}</EuiFlexItem>
                    </EuiFlexGroup>
                  )}
                </PageHeader>

                <div data-test-subj="pplBranch">
                  <CustomSteps
                    steps={[
                      {
                        title: 'Monitor details',
                        children: this.renderMonitorDetails(values, setFieldValue),
                      },
                      {
                        title: 'Query',
                        children: this.renderPplQuery(values, setFieldValue),
                      },
                      {
                        title: 'Schedule',
                        children: this.renderSchedule(values, setFieldValue),
                      },
                      {
                        title: 'Triggers',
                        children: (
                          <>
                            <FieldArray name="triggerDefinitions" validateOnChange>
                              {(triggerArrayHelpers) => (
                                <ConfigureTriggersPpl
                                  triggerArrayHelpers={triggerArrayHelpers}
                                  edit={edit}
                                  monitor={monitorContextForTriggers}
                                  monitorValues={values}
                                  setFlyout={this.props.setFlyout}
                                  triggers={triggerDefinitions}
                                  triggerValues={values}
                                  isDarkMode={isDarkMode}
                                  httpClient={httpClient}
                                  notifications={notifications}
                                  notificationService={notificationService}
                                  plugins={plugins}
                                  pluginsLoading={pluginsLoading}
                                />
                              )}
                            </FieldArray>

                            <EuiSpacer />
                            <EuiFlexGroup alignItems="center" justifyContent="flexEnd">
                              <EuiFlexItem grow={false}>
                                <EuiSmallButtonEmpty onClick={this.onCancel}>
                                  Cancel
                                </EuiSmallButtonEmpty>
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiSmallButton
                                  fill
                                  onClick={handleSubmit}
                                  isLoading={isSubmitting}
                                >
                                  {edit ? 'Save' : 'Create'}
                                </EuiSmallButton>
                              </EuiFlexItem>
                            </EuiFlexGroup>
                          </>
                        ),
                      },
                    ]}
                  />
                </div>

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
                      this.setState({ createModalOpen: false, formikBag: undefined });
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

export default PplAlertingCreateMonitor;
