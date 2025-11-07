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
  EuiPanel,
  EuiFormRow,
  EuiTitle,
  EuiButton,
  EuiCodeBlock,
  EuiEmptyPrompt,
  EuiCodeEditor,
  EuiFieldText,
  EuiTextArea,
  EuiSelect,
  EuiFieldNumber,
  EuiHorizontalRule,
  EuiAccordion,
  EuiTextColor,
  EuiIconTip,
  EuiBadge,
  EuiCheckbox,
  EuiToolTip,
  EuiSwitch,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
} from '@elastic/eui';

import DefineMonitor from '../DefineMonitor';
import CustomSteps from '../../components/CustomSteps';
import { FORMIK_INITIAL_VALUES } from './utils/constants';
import { formikToMonitor } from './utils/formikToMonitor';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { SubmitErrorHandler } from '../../../../utils/SubmitErrorHandler';
import MonitorDetails from '../MonitorDetails';
import ConfigureTriggers from '../../../CreateTrigger/containers/ConfigureTriggers';
import { triggerToFormik } from '../../../CreateTrigger/containers/CreateTrigger/utils/triggerToFormik';
import WorkflowDetails from '../WorkflowDetails/WorkflowDetails';
import {
  getInitialValues,
  getPlugins,
  submit,
  runPPLPreview,
  submitPPL,
  extractIndicesFromPPL,
  findCommonDateFields,
} from './utils/helpers';
import {
  getPerformanceModal,
  RECOMMENDED_DURATION,
} from '../../components/QueryPerformance/QueryPerformance';
import { isDataSourceChanged } from '../../../utils/helpers';
import { PageHeader } from '../../../../components/PageHeader/PageHeader';
import { monaco, loadMonaco } from '@osd/monaco';
import { CoreContext } from '../../../../utils/CoreContext';
import { QueryEditor } from '../../../../components/QueryEditor';
import { AlertingDataTable } from '../../../../components/DataTable';
import { setDataSource, isPplV2Enabled } from '../../../../services';

class CreateMonitor extends Component {
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
    const baseInitial = getInitialValues({ location, monitorToEdit, edit });
    const pplEnabled = isPplV2Enabled();
    const initialValues = {
      ...baseInitial,
      // Only override monitor_mode if explicitly provided, otherwise use baseInitial or default
      monitor_mode: baseInitial.monitor_mode || FORMIK_INITIAL_VALUES.monitor_mode,
      useLookBackWindow: baseInitial.useLookBackWindow ?? true,
      lookBackAmount: baseInitial.lookBackAmount ?? 1,
      lookBackUnit: baseInitial.lookBackUnit || 'hours',
      timestampField: baseInitial.timestampField || '@timestamp',
    };
    try {
      const params = new URLSearchParams(location?.search || '');
      const incoming = params.get('ppl') || params.get('pplQuery');
      const incomingDataSourceId = params.get('dataSourceId');

      if (incoming) {
        initialValues.pplQuery = decodeURIComponent(incoming);
        // optional: ensure we're in PPL mode
        initialValues.monitor_mode = 'ppl';
      }

      if (incomingDataSourceId) {
        initialValues.dataSourceId = incomingDataSourceId;
      }

      // optional: clean the URL so the value doesn't re-apply on back/forward
      if ((incoming || incomingDataSourceId) && props.history?.replace) {
        props.history.replace({ ...location, search: '' });
      }
    } catch {
      // noop — safe fallback if URL parsing fails
    }

    // Adjust default flow based on viewMode selection from monitors page
    if (!pplEnabled) {
      initialValues.monitor_mode = 'legacy';
      try {
        localStorage.setItem('alerting_monitors_view_mode', 'classic');
      } catch (e) {
        // ignore storage errors
      }
    } else if (!edit) {
      let storedViewMode = 'new';
      try {
        const stored = localStorage.getItem('alerting_monitors_view_mode');
        if (stored === 'classic' || stored === 'new') {
          storedViewMode = stored;
        }
      } catch (e) {
        // ignore localStorage access errors
      }

      if (storedViewMode === 'classic') {
        initialValues.monitor_mode = 'legacy';
      } else {
        initialValues.monitor_mode = 'ppl';
      }
    }

    // Helpers to map v2 trigger fields -> Formik fields used by DefineTrigger
    const parseDuration = (val) => {
      // Handle integer minutes from backend
      if (typeof val === 'number') {
        const minutes = val;
        // Convert to days if evenly divisible by 1440 (24 * 60)
        if (minutes >= 1440 && minutes % 1440 === 0) {
          return { value: minutes / 1440, unit: 'days' };
        }
        // Convert to hours if evenly divisible by 60
        if (minutes >= 60 && minutes % 60 === 0) {
          return { value: minutes / 60, unit: 'hours' };
        }
        // Otherwise, use minutes
        return { value: minutes, unit: 'minutes' };
      }

      // Handle string durations like "30m", "7d", "12h", "15min"
      if (typeof val === 'string') {
        const m = val.trim().match(/^(\d+)\s*([a-zA-Z]+)$/);
        if (!m) return { value: '', unit: 'minutes' };
        const amount = Number(m[1]);
        const u = m[2].toLowerCase();
        let unit = 'minutes';
        if (u.startsWith('m')) unit = 'minutes';
        else if (u.startsWith('h')) unit = 'hours';
        else if (u.startsWith('d')) unit = 'days';
        else if (u.startsWith('s')) unit = 'seconds'; // tolerated, even if UI hides seconds
        return { value: Number.isFinite(amount) ? amount : '', unit };
      }

      return { value: '', unit: 'minutes' };
    };

    const mapComparator = (sym) => {
      // common names used by threshold UIs
      switch (sym) {
        case '>':
          return 'gt';
        case '>=':
          return 'gte';
        case '<':
          return 'lt';
        case '<=':
          return 'lte';
        case '==':
        case '===':
          return 'eq';
        case '!=':
        case '!==':
          return 'ne';
        default:
          return 'gte';
      }
    };

    const pplTriggerToFormik = (t) => {
      const { value: suppressValue, unit: suppressUnit } = parseDuration(t.suppress);
      const { value: expirationValue, unit: expirationUnit } = parseDuration(t.expires || '7d');
      const thresholdValue = t.num_results_value != null ? Number(t.num_results_value) : '';
      const thresholdEnum = mapComparator(t.num_results_condition);
      return {
        // raw v2 fields preserved
        ...t,
        // fields expected by DefineTrigger/ConfigureTriggers
        name: t.name,
        severity: (t.severity || '').toString().toLowerCase(), // keep lower for data; UI uppercases
        mode: t.mode,
        type: t.type, // 'number_of_results' | 'custom'
        thresholdValue,
        thresholdEnum, // 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne'
        custom_condition: t.custom_condition,
        suppressEnabled: !!t.suppress,
        suppress: t.suppress
          ? { value: suppressValue, unit: suppressUnit, enabled: true }
          : undefined,
        expires: t.expires ? { value: expirationValue, unit: expirationUnit } : undefined,
        queryLevelTrigger: {
          expires: t.expires ?? '',
          suppress: t.suppress ?? '',
          thresholdValue,
          thresholdEnum,
          type: t.type,
          mode: t.mode,
          custom_condition: t.custom_condition,
        },
      };
    };

    const getExistingPplTriggers = (src) => {
      const candidates = [
        src?.ppl_monitor?.triggers, // normalized to .ppl_monitor
        src?.monitor_v2?.ppl_monitor?.triggers, // raw v2 doc shape (snake_case)
        src?.monitorV2?.ppl_monitor?.triggers, // raw v2 doc shape (camelCase)
        src?.monitor?.ppl_monitor?.triggers, // sometimes wrapped in .monitor
        src?.monitor?.monitor_v2?.ppl_monitor?.triggers, // wrapped + v2 (snake_case)
        src?.monitor?.monitorV2?.ppl_monitor?.triggers, // wrapped + v2 (camelCase)
        src?.triggers, // normalized .triggers on the root
      ];
      for (const c of candidates) {
        if (Array.isArray(c)) return c;
      }
      return [];
    };

    let triggerToEdit;
    if (edit && monitorToEdit) {
      triggerToEdit = triggerToFormik(_.get(monitorToEdit, 'triggers', []), monitorToEdit);
    }

    if (edit && monitorToEdit) {
      const pplTriggers = getExistingPplTriggers(monitorToEdit);
      if (Array.isArray(pplTriggers) && pplTriggers.length) {
        initialValues.triggerDefinitions = pplTriggers.map((t) => ({
          ...pplTriggerToFormik(t, monitorToEdit),
          id: t.id,
          actions: Array.isArray(t.actions) ? t.actions : [],
        }));
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
      showRaw: false,
      queryLibOpen: false,
      previewOpen: false,
      indices: [],
      availableDateFields: [],
      dateFieldsLoading: false,
      dateFieldsError: null,
    };
  }

  // Fetch indices once for the current dataSourceId
  fetchInitialIndices = async () => {
    const { httpClient, landingDataSourceId } = this.props;

    // Prefer the selected DS in the form if present, else landing
    const dsId = this.formikRef.current?.values?.dataSourceId || landingDataSourceId;

    // If no dataSourceId, try to fetch indices anyway (for local cluster)
    if (!dsId) {
      try {
        const resp = await httpClient.get('/api/alerting/indices');
        const indices = resp?.indices || [];
        this.setState({ indices });
        return;
      } catch (e) {
        console.error('[CreateMonitor] Error fetching indices (local):', e);
        this.setState({ indices: [] });
        return;
      }
    }

    try {
      const resp = await httpClient.get('/api/alerting/indices', {
        query: { dataSourceId: dsId },
      });
      const indices = resp?.indices || [];
      this.setState({ indices });
    } catch (e) {
      console.error('[CreateMonitor] Error fetching indices:', e);
      this.setState({ indices: [] });
    }
  };

  // Detect and auto-populate timestamp fields from PPL query
  detectTimestampFields = async (pplQuery) => {
    const { httpClient, landingDataSourceId } = this.props;

    // Extract indices from PPL query
    const indices = extractIndicesFromPPL(pplQuery);

    if (indices.length === 0) {
      this.setState({
        availableDateFields: [],
        dateFieldsError: 'No indices found in query',
        dateFieldsLoading: false,
      });
      // Automatically disable lookback window when no indices
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
        // Automatically disable lookback window when no valid date fields
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
        // Automatically disable lookback window when no valid date fields
        if (this.formikRef.current) {
          this.formikRef.current.setFieldValue('useLookBackWindow', false, false);
        }
        return;
      }

      // Auto-populate with the first field (prioritized to be @timestamp)
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
      console.error('[detectTimestampFields] Error:', err);
      this.setState({
        availableDateFields: [],
        dateFieldsError: err?.message || 'Failed to detect timestamp fields',
        dateFieldsLoading: false,
      });
      // Automatically disable lookback window on error
      if (this.formikRef.current) {
        this.formikRef.current.setFieldValue('useLookBackWindow', false, false);
      }
    }
  };

  getNotifications = () => {
    return this.context?.services?.notifications || this.props.notifications;
  };

  async componentDidMount() {
    const { httpClient, landingDataSourceId } = this.props;

    // Initialize query in queryString service to prevent "Query was not set" errors
    try {
      console.log('[componentDidMount] Initializing query service...');
      const services = (this.context && (this.context.services || this.context)) || undefined;
      console.log('[componentDidMount] services:', services);

      const queryString = services?.data?.query?.queryString;
      console.log('[componentDidMount] queryString service:', queryString);

      if (queryString) {
        console.log('[componentDidMount] Setting query to empty PPL with dataset...');

        // Get or create a default dataset for PPL queries
        const getDefaultDataset = async () => {
          try {
            const dataViews = services?.data?.dataViews;
            if (dataViews) {
              const defaultDataView = await dataViews.getDefault();
              if (defaultDataView) {
                return dataViews.convertToDataset(defaultDataView);
              }
            }
          } catch (err) {
            console.error('[componentDidMount] Error getting default dataset:', err);
          }
          return undefined;
        };

        const dataset = await getDefaultDataset();
        console.log('[componentDidMount] Dataset:', dataset);

        queryString.setQuery({
          query: '',
          language: 'PPL',
          dataset: dataset,
        });
        console.log('[componentDidMount] Query set successfully with dataset');

        // Verify it was set
        try {
          const currentQuery = queryString.getQuery();
          console.log('[componentDidMount] Current query after setting:', currentQuery);
        } catch (verifyErr) {
          console.error('[componentDidMount] Failed to verify query was set:', verifyErr);
        }
      } else {
        console.warn('[componentDidMount] queryString service is not available');
      }
    } catch (e) {
      console.error('[componentDidMount] Error initializing query:', e);
    }

    // Set data source before making any API calls that use getDataSourceQueryObj()
    // Initialize with empty object if landingDataSourceId is not available yet
    if (landingDataSourceId) {
      setDataSource({ dataSourceId: landingDataSourceId });
    } else {
      // Initialize with empty/null to prevent "DataSource was not set" error
      setDataSource({ dataSourceId: undefined });
    }

    const updatePlugins = async () => {
      try {
        const newPlugins = await getPlugins(httpClient);
        this.setState({ plugins: newPlugins, pluginsLoading: false });
      } catch (error) {
        console.error('[CreateMonitor] Error fetching plugins:', error);
        // Set pluginsLoading to false even on error so UI doesn't get stuck
        this.setState({ pluginsLoading: false });
      }
    };

    updatePlugins();
    this.setSchedule();
    this.fetchInitialIndices();

    // Detect timestamp fields from initial PPL query if present
    const initialPplQuery = this.formikRef.current?.values?.pplQuery;
    if (initialPplQuery) {
      this.detectTimestampFields(initialPplQuery);
    }
  }

  componentDidUpdate(prevProps) {
    if (isDataSourceChanged(prevProps, this.props)) {
      // Update the data source service
      if (this.props.landingDataSourceId) {
        setDataSource({ dataSourceId: this.props.landingDataSourceId });
      }

      this.formikRef.current?.setFieldValue(
        'dataSourceId',
        this.props.landingDataSourceId,
        false /* no validate */
      );

      // Refetch plugins with new data source
      const updatePlugins = async () => {
        this.setState({ pluginsLoading: true });
        try {
          const newPlugins = await getPlugins(this.props.httpClient);
          this.setState({ plugins: newPlugins, pluginsLoading: false });
        } catch (error) {
          console.error('[CreateMonitor] Error refetching plugins:', error);
          this.setState({ pluginsLoading: false });
        }
      };
      updatePlugins();
    }
  }

  // componentWillUnmount() {
  //   this.props.setFlyout(null);
  // }
  componentDidUpdate(prevProps, prevState) {
    // Log context changes for debugging
    if (this.context !== prevProps?.context) {
      console.log('[componentDidUpdate] Context changed');
      console.log('[componentDidUpdate] New context:', this.context);

      const services = (this.context && (this.context.services || this.context)) || undefined;
      const queryString = services?.data?.query?.queryString;
      console.log('[componentDidUpdate] queryString service available:', !!queryString);

      if (queryString) {
        try {
          const currentQuery = queryString.getQuery();
          console.log('[componentDidUpdate] Current query:', currentQuery);
        } catch (e) {
          console.error('[componentDidUpdate] Error getting query (not set yet):', e);
          // If query is not set, try to initialize it with dataset
          try {
            console.log('[componentDidUpdate] Attempting to initialize query service...');

            // Get default dataset asynchronously
            (async () => {
              let dataset = undefined;
              try {
                const dataViews = services?.data?.dataViews;
                if (dataViews) {
                  const defaultDataView = await dataViews.getDefault();
                  if (defaultDataView) {
                    dataset = dataViews.convertToDataset(defaultDataView);
                  }
                }
              } catch (datasetErr) {
                console.error('[componentDidUpdate] Error getting dataset:', datasetErr);
              }

              queryString.setQuery({
                query: '',
                language: 'PPL',
                dataset: dataset,
              });
              console.log('[componentDidUpdate] Query initialized successfully with dataset');
            })();
          } catch (setErr) {
            console.error('[componentDidUpdate] Failed to initialize query:', setErr);
          }
        }
      }
    }
  }

  componentWillUnmount() {
    try {
      this.props.setFlyout(null);
    } catch (e) {}
    // if (this._onFocusDisposable) {
    //   try { this._onFocusDisposable.dispose(); } catch (e) {}
    //   this._onFocusDisposable = null;
    // }
    // if (this._pplEditor) {
    //   try { this._pplEditor.dispose(); } catch (e) {}
    //   this._pplEditor = null;
    // }
    // if (this._monacoCompletionDisposable) {
    //   try { this._monacoCompletionDisposable.dispose(); } catch (e) {}
    //   this._monacoCompletionDisposable = null;
    // }
    // this._pplEditor = null;
  }

  resetResponse() {
    this.setState({ response: null, performanceResponse: null });
  }

  onCancel = () => {
    if (this.props.edit) this.props.history.goBack();
    else this.props.history.push('/monitors');
  };

  setSchedule = () => {
    const { edit, monitorToEdit } = this.props;
    const { initialValues } = this.state;

    if (edit) {
      const schedule = _.get(monitorToEdit, 'ppl_monitor.schedule') ||
        _.get(monitorToEdit, 'schedule') || { period: FORMIK_INITIAL_VALUES.period };
      const scheduleType = _.keys(schedule)[0];
      switch (scheduleType) {
        case 'cron':
          _.set(initialValues, 'frequency', 'cronExpression');
          break;
        default:
          _.set(initialValues, 'period', schedule.period || FORMIK_INITIAL_VALUES.period);
          break;
      }

      // hydrate look_back_window if present (integer in minutes)
      const lbw =
        monitorToEdit?.look_back_window || monitorToEdit?.ppl_monitor?.look_back_window || null;
      if (lbw) {
        const minutes = Number(lbw);
        if (Number.isFinite(minutes) && minutes > 0) {
          _.set(initialValues, 'useLookBackWindow', true);

          // Convert minutes to best fitting unit
          if (minutes >= 1440 && minutes % 1440 === 0) {
            // Days
            _.set(initialValues, 'lookBackAmount', minutes / 1440);
            _.set(initialValues, 'lookBackUnit', 'days');
          } else if (minutes >= 60 && minutes % 60 === 0) {
            // Hours
            _.set(initialValues, 'lookBackAmount', minutes / 60);
            _.set(initialValues, 'lookBackUnit', 'hours');
          } else {
            // Minutes
            _.set(initialValues, 'lookBackAmount', minutes);
            _.set(initialValues, 'lookBackUnit', 'minutes');
          }
        }
      }

      // hydrate timestamp_field if present
      const tsField =
        monitorToEdit?.timestamp_field ||
        monitorToEdit?.ppl_monitor?.timestamp_field ||
        '@timestamp';
      _.set(initialValues, 'timestampField', tsField);
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
    const { triggerToEdit } = this.state;

    // ppl
    if (values.monitor_mode === 'ppl') {
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
      return;
    }

    // legacy
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
  };

  onCloseTrigger = () => {
    this.props.history.push({ ...this.props.location, search: '' });
  };

  buildMonitorForTriggers = (values) => {
    if (values.monitor_mode === 'ppl') {
      // Robustly get existing PPL triggers from any supported shape
      const getExistingPplTriggers = (src) => {
        const candidates = [
          src?.ppl_monitor?.triggers,
          src?.monitor_v2?.ppl_monitor?.triggers,
          src?.monitorV2?.ppl_monitor?.triggers,
          src?.monitor?.ppl_monitor?.triggers,
          src?.monitor?.monitor_v2?.ppl_monitor?.triggers,
          src?.monitor?.monitorV2?.ppl_monitor?.triggers,
          src?.triggers,
        ];
        for (const c of candidates) {
          if (Array.isArray(c)) return c;
        }
        return [];
      };
      const existingTriggers =
        this.props.edit && this.props.monitorToEdit
          ? getExistingPplTriggers(this.props.monitorToEdit)
          : [];

      return {
        name: values.name || '',
        type: 'monitor',
        monitor_type: MONITOR_TYPE.QUERY_LEVEL,
        enabled: true,
        schedule: { period: { interval: 1, unit: 'MINUTES' } },
        inputs: [{ search: { indices: [], query: { match_all: {} } } }],
        ui_metadata: {
          search: { searchType: 'query' },
          triggers: {},
        },
        // Feed existing PPL triggers to ConfigureTriggers in edit flow
        triggers: existingTriggers,
      };
    }

    const monitor = formikToMonitor(values) || {};
    if (!Array.isArray(monitor.inputs) || monitor.inputs.length === 0) {
      monitor.inputs = [{ search: { indices: [], query: { match_all: {} } } }];
      return monitor;
    }
    const first = monitor.inputs[0];
    if (!first.search) first.search = { indices: [], query: { match_all: {} } };
    if (!Array.isArray(first.search.indices)) first.search.indices = [];
    if (!first.search.query) first.search.query = { match_all: {} };
    return monitor;
  };

  renderPplDetailsBody = (values, setFieldValue) => (
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
              if (value.length <= 10000) {
                setFieldValue('description', value);
              }
            }}
            placeholder="Describe the monitor"
            fullWidth
          />
          {values.description && (
            <EuiText size="xs" color="subdued" style={{ marginTop: '4px' }}>
              {values.description.length} / 10,000 characters
            </EuiText>
          )}
        </>
      </EuiFormRow>

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
          onChange={(e) => setFieldValue('monitor_mode', e.target.checked ? 'legacy' : 'ppl')}
          data-test-subj="useClassicCheckboxPplInline"
        />
      </EuiFormRow>
    </>
  );

  // ---- PPL Schedule (unchanged) ----

  // Debounced timestamp field detection
  debouncedDetectTimestampFields = _.debounce((pplQuery) => {
    this.detectTimestampFields(pplQuery);
  }, 1000);

  renderPplQueryBody = (values, setFieldValue) => (
    <>
      {/* Top row with PPL badge and Run preview */}
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
            onClick={async () => {
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
                this.setState({
                  previewResult: data,
                  previewQuery: values.pplQuery || '',
                  previewLoading: false,
                  previewOpen: true,
                });
              } catch (e) {
                this.setState({
                  previewError: e?.body?.message || e?.message || 'Preview failed',
                  previewLoading: false,
                  previewOpen: true,
                });
              }
            }}
            isLoading={this.state.previewLoading}
            data-test-subj="runPreview"
          >
            Run preview
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      {/* Query editor */}
      <div data-test-subj="pplEditorMonaco">
        <QueryEditor
          value={values.pplQuery || ''}
          onChange={(text) => {
            // Enforce 10,000 character limit
            if (text.length <= 10000) {
              setFieldValue('pplQuery', text);

              // Also update the queryString service so saved queries can access it
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
                // Silent fail - not critical
              }

              // Trigger debounced timestamp field detection
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
            <>
              <AlertingDataTable
                pplResponse={this.state.previewResult}
                isLoading={this.state.previewLoading}
                services={this.context?.services || this.context}
              />
            </>
          )}
        </EuiPanel>
      </EuiAccordion>
    </>
  );

  // ---- PPL Schedule ----
  renderPplScheduleBody(values, setFieldValue) {
    const useLB = values.useLookBackWindow !== undefined ? values.useLookBackWindow : true;
    const lbAmount = Number(values.lookBackAmount !== undefined ? values.lookBackAmount : 1);
    const lbUnit = values.lookBackUnit || 'hours';
    const { availableDateFields, dateFieldsError, dateFieldsLoading } = this.state;

    // Validation limits (in minutes)
    const LIMITS = {
      lookback: { min: 1 }, // minimum 1 minute
      interval: { min: 1 }, // minimum 1 minute
    };

    // Calculate total minutes for validation
    const lbMinutes =
      lbUnit === 'minutes' ? lbAmount : lbUnit === 'hours' ? lbAmount * 60 : lbAmount * 1440;
    const lbError = lbAmount !== '' && lbMinutes < LIMITS.lookback.min;

    // Calculate interval validation
    const intervalAmount = Number(values.period?.interval ?? 1);
    const intervalUnit = values.period?.unit || 'MINUTES';
    const intervalMinutes =
      intervalUnit === 'MINUTES'
        ? intervalAmount
        : intervalUnit === 'HOURS'
        ? intervalAmount * 60
        : intervalAmount * 1440;
    const intervalError = intervalAmount !== '' && intervalMinutes < LIMITS.interval.min;

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
              // Only allow enabling if there are valid date fields
              if (dateFieldsError && availableDateFields.length === 0) {
                setFieldValue('useLookBackWindow', false);
              } else {
                setFieldValue('useLookBackWindow', e.target.checked);
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
              label="Look back from"
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
          <>
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
          </>
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
              Use cron expressions for complex schedules
            </EuiText>

            <EuiSpacer size="m" />
          </>
        )}
        {LookBackControls}
      </>
    );
  }
  // ---- END PPL schedule ----

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
    const { createModalOpen, initialValues, plugins, pluginsLoading } = this.state;

    return (
      <div style={{ padding: '16px' }}>
        <Formik
          innerRef={this.formikRef}
          initialValues={initialValues}
          onSubmit={this.evaluateSubmission}
          validateOnChange={false}
          enableReinitialize={false}
        >
          {({ values, errors, handleSubmit, isSubmitting, isValid, touched, setFieldValue }) => {
            const isComposite = values.monitor_type === MONITOR_TYPE.COMPOSITE_LEVEL;
            const safeMonitor = this.buildMonitorForTriggers(values);
            const safeTriggers = _.get(safeMonitor, 'triggers', []);

            const ClassicToggleHeader = (
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
                onChange={(e) => setFieldValue('monitor_mode', e.target.checked ? 'legacy' : 'ppl')}
                data-test-subj="useClassicCheckboxHeader"
              />
            );

            const ClassicToggleInline = (
              // Shown only in Classic flow (bottom of Monitor Details card area)
              <EuiFormRow fullWidth>
                <EuiCheckbox
                  id="useClassicMonitorsInline"
                  label={
                    <span>
                      Use classic monitors{' '}
                      <EuiToolTip content="Use pre-existing monitor types available in classic alerts.">
                        <EuiIconTip type="iInCircle" data-test-subj="classicInfoInline" />
                      </EuiToolTip>
                    </span>
                  }
                  checked={values.monitor_mode === 'legacy'}
                  onChange={(e) =>
                    setFieldValue('monitor_mode', e.target.checked ? 'legacy' : 'ppl')
                  }
                  data-test-subj="useClassicCheckboxInline"
                />
              </EuiFormRow>
            );

            return (
              <Fragment>
                <PageHeader>
                  <EuiText size="s">
                    <h1>{edit ? 'Edit' : 'Create'} monitor</h1>
                  </EuiText>
                </PageHeader>

                {values.monitor_mode === 'ppl' ? (
                  <div data-test-subj="pplBranch">
                    <CustomSteps
                      steps={[
                        {
                          title: 'Monitor details',
                          children: this.renderPplDetailsBody(values, setFieldValue),
                        },
                        {
                          title: 'Query',
                          children: this.renderPplQueryBody(values, setFieldValue),
                        },
                        {
                          title: 'Schedule',
                          children: this.renderPplScheduleBody(values, setFieldValue),
                        },
                        {
                          title: 'Triggers',
                          children: (
                            <>
                              <FieldArray name="triggerDefinitions" validateOnChange>
                                {(triggerArrayHelpers) => (
                                  <ConfigureTriggers
                                    edit={edit}
                                    triggerArrayHelpers={triggerArrayHelpers}
                                    monitor={safeMonitor}
                                    monitorValues={values}
                                    touched={touched}
                                    setFlyout={this.props.setFlyout}
                                    triggers={safeTriggers}
                                    triggerValues={values}
                                    isDarkMode={this.props.isDarkMode}
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
                ) : (
                  <div data-test-subj="legacyBranch">
                    {/* Monitor Details card */}
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

                    {/* Place the classic toggle RIGHT BELOW the Monitor Details card
                        (i.e., after schedule's "Run every" UI) */}
                    <EuiSpacer size="s" />
                    {ClassicToggleInline}
                    <EuiSpacer />

                    {isComposite && (
                      <>
                        <WorkflowDetails
                          isDarkMode={isDarkMode}
                          values={values}
                          httpClient={httpClient}
                          errors={errors}
                        />
                        <EuiSpacer />
                      </>
                    )}

                    {values.searchType !== SEARCH_TYPE.AD &&
                      values.monitor_type !== MONITOR_TYPE.COMPOSITE_LEVEL &&
                      !values.preventVisualEditor && (
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
                          />
                          <EuiSpacer />
                        </div>
                      )}

                    <FieldArray name="triggerDefinitions" validateOnChange>
                      {(triggerArrayHelpers) => (
                        <ConfigureTriggers
                          edit={edit}
                          triggerArrayHelpers={triggerArrayHelpers}
                          monitor={safeMonitor}
                          monitorValues={values}
                          touched={touched}
                          setFlyout={this.props.setFlyout}
                          triggers={safeTriggers}
                          triggerValues={values}
                          isDarkMode={this.props.isDarkMode}
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
                        <EuiSmallButtonEmpty onClick={this.onCancel}>Cancel</EuiSmallButtonEmpty>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiSmallButton fill onClick={handleSubmit} isLoading={isSubmitting}>
                          {edit ? 'Save' : 'Create'}
                        </EuiSmallButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </div>
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
export default CreateMonitor;
