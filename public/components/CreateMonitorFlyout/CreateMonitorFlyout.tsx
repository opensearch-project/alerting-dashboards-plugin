/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiTitle,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  EuiCallOut,
  EuiFormRow,
  EuiFieldText,
  EuiTextArea,
  EuiCheckbox,
  EuiToolTip,
  EuiIconTip,
  EuiIcon,
  EuiTextColor,
  EuiSelect,
  EuiFieldNumber,
  EuiAccordion,
  EuiPanel,
  EuiHorizontalRule,
  EuiEmptyPrompt,
  EuiCodeBlock,
  EuiSmallButton,
  EuiLink,
} from '@elastic/eui';
import './CreateMonitorFlyout.scss';
import { Formik, FieldArray } from 'formik';
import { Provider } from 'react-redux';
import _ from 'lodash';
import {
  FORMIK_INITIAL_VALUES,
  MONITOR_NAME_MAX_LENGTH,
  MONITOR_DESCRIPTION_MAX_LENGTH,
  LOOKBACK_WINDOW_MIN_MINUTES,
} from '../../pages/CreateMonitor/containers/CreateMonitor/utils/constants';
import { formikToMonitor } from '../../pages/CreateMonitor/containers/CreateMonitor/utils/formikToMonitor';
import { getClient, setDataSource, NotificationService } from '../../services';
import { backendErrorNotification } from '../../utils/helpers';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../utils/constants';
import CustomSteps from '../../pages/CreateMonitor/components/CustomSteps';
import ConfigureTriggersPpl from '../../pages/CreateTrigger/containers/ConfigureTriggers/ConfigureTriggersPpl';
import { QueryEditor } from '../../pages/CreateMonitor/components/QueryEditor';
import { AlertingDataTable } from '../DataTable';
import {
  runPPLPreview,
  extractIndicesFromPPL,
  findCommonDateFields,
  getPlugins,
  makeAlertingV2Service,
} from '../../pages/CreateMonitor/containers/CreateMonitor/utils/pplAlertingHelpers';
import { buildPPLMonitorFromFormik } from '../../pages/CreateMonitor/containers/CreateMonitor/utils/pplFormikToMonitor';
import { CoreContext } from '../../utils/CoreContext';
import { getAlertingStore } from '../../redux/store';

// Import type from explore plugin
type FlyoutComponentProps = {
  closeFlyout: () => void;
  dependencies: {
    query: any;
    resultStatus: any;
    queryInEditor: string;
  };
  services: any;
};

type CreateMonitorFlyoutState = {
  isSubmitting: boolean;
  submitError: string | null;
  previewLoading: boolean;
  previewError: string | null;
  previewResult: any;
  previewQuery: string;
  previewOpen: boolean;
  indices: any[];
  availableDateFields: string[];
  dateFieldsLoading: boolean;
  dateFieldsError: string | null;
  plugins: any[];
  pluginsLoading: boolean;
};


export class CreateMonitorFlyout extends Component<FlyoutComponentProps, CreateMonitorFlyoutState> {
  static contextType = CoreContext;
  formikRef = React.createRef<any>();
  debouncedDetectTimestampFields: any;
  store: any;
  notificationService: any;

  constructor(props: FlyoutComponentProps) {
    super(props);

    this.state = {
      isSubmitting: false,
      submitError: null,
      previewLoading: false,
      previewError: null,
      previewResult: null,
      previewQuery: '',
      previewOpen: false,
      indices: [],
      availableDateFields: [],
      dateFieldsLoading: false,
      dateFieldsError: null,
      plugins: [],
      pluginsLoading: true,
    };

    // Initialize Redux store for QueryEditor
    this.store = getAlertingStore();

    // Initialize NotificationService for ConfigureTriggers/ConfigureActions
    const httpClient = getClient();
    this.notificationService = new NotificationService(httpClient);

    // Debounced timestamp field detection
    this.debouncedDetectTimestampFields = _.debounce((pplQuery: string) => {
      this.detectTimestampFields(pplQuery);
    }, 1000);
  }

  async componentDidMount() {
    const { services, dependencies } = this.props;

    // Set data source before making any API calls that use getDataSourceQueryObj()
    const dataSourceId = dependencies.query.dataset?.dataSource?.id || '';
    setDataSource({ dataSourceId: dataSourceId });

    // Initialize query in queryString service
    try {
      const queryString = services?.data?.query?.queryString;
      if (queryString) {
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
            console.error('[CreateMonitorFlyout] Error getting default dataset:', err);
          }
          return undefined;
        };

        const dataset = await getDefaultDataset();
        queryString.setQuery({
          query: this.props.dependencies.queryInEditor || '',
          language: 'PPL',
          dataset: dataset,
        });
      }
    } catch (e) {
      console.error('[CreateMonitorFlyout] Error initializing query:', e);
      const toasts = services?.notifications?.toasts;
      if (toasts?.addDanger) {
        toasts.addDanger({
          title: 'Unable to initialize query editor',
          text: e?.message || 'The query editor could not be prepared. See console for details.',
        });
      }
    }

    // Fetch plugins
    const updatePlugins = async () => {
      try {
        const httpClient = getClient();
        const newPlugins = await getPlugins(httpClient);
        this.setState({ plugins: newPlugins, pluginsLoading: false });
      } catch (error) {
        console.error('[CreateMonitorFlyout] Error fetching plugins:', error);
        this.setState({ pluginsLoading: false });
      }
    };
    updatePlugins();

    // Fetch indices
    this.fetchInitialIndices();

    // Detect timestamp fields from initial PPL query (with slight delay to ensure Formik is ready)
    // Clean up backticks from the query (Explore plugin adds them)
    const rawQuery = this.props.dependencies.queryInEditor || '';
    if (rawQuery) {
      setTimeout(() => {
        this.detectTimestampFields(rawQuery);
      }, 300);
    }
  }

  fetchInitialIndices = async () => {
    const httpClient = getClient();
    const { dependencies } = this.props;
    const dsId = dependencies.query.dataset?.dataSource?.id;

    try {
      const resp = dsId
        ? await httpClient.get('/api/alerting/indices', { query: { dataSourceId: dsId } })
        : await httpClient.get('/api/alerting/indices');
      const indices = resp?.indices || [];
      this.setState({ indices });
    } catch (e) {
      console.error('[CreateMonitorFlyout] Error fetching indices:', e);
      this.setState({ indices: [] });
    }
  };

  detectTimestampFields = async (pplQuery: string) => {
    const httpClient = getClient();
    const { dependencies } = this.props;

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
      const dataSourceId = dependencies.query.dataset?.dataSource?.id;
      const { commonDateFields, error } = await findCommonDateFields(
        httpClient,
        indices,
        dataSourceId
      );

      if (error || commonDateFields.length === 0) {
        this.setState({
          availableDateFields: [],
          dateFieldsError: error || 'No common date fields found across all indices',
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
    } catch (err: any) {
      console.error('[detectTimestampFields] Error:', err);
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

  handleSubmit = async (values: any, formikBag: any) => {
    const { services, closeFlyout, dependencies } = this.props;
    this.setState({ isSubmitting: true, submitError: null });

    try {
      const httpClient = getClient();
      const api = makeAlertingV2Service(httpClient);
      const body = buildPPLMonitorFromFormik(values);
      const dataSourceId = values.dataSourceId || dependencies.query.dataset?.dataSource?.id;

      // Create the monitor and capture the response to get the monitor ID
      const response = await api.createMonitor(body, { dataSourceId });
      formikBag.setSubmitting(false);

      // Extract monitor ID from response
      const monitorId = response?._id || response?.monitor_id || response?.id;
      // Build the monitors list page URL by replacing /app/explore with /app/monitors
      const currentUrl = window.location.href;
      const monitorsListUrl = currentUrl
        .replace(/\/app\/explore.*$/, `/app/monitors#/monitors?dataSourceId=${dataSourceId || ''}&from=0&search=&size=20&sortDirection=desc&sortField=name&state=all`);

        // Show success toast with clickable link to monitors list
      services.notifications.toasts.addSuccess({
        title: 'Monitor created successfully',
        text: (
          <p>
            <a
              href={monitorsListUrl}
              style={{ textDecoration: 'underline', fontWeight: 'bold' }}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = monitorsListUrl;
              }}
            >
              View here
            </a>
          </p>
        ),
        toastLifeTimeMs: 10000,
      });
      formikBag.setSubmitting(false);
        closeFlyout();
    } catch (error: any) {
      console.error('Error creating monitor:', error);
      
      // Parse error message to provide user-friendly feedback
      let userMessage = 'An error occurred while creating the monitor';
      const rawErrorMessage = error?.message || error?.body?.message || '';
      const errorDetails = rawErrorMessage.toLowerCase();

      // Check for common error patterns and provide helpful messages
      if (errorDetails.includes('duplicate') || errorDetails.includes('already exists')) {
        userMessage = 'A monitor with this name already exists. Please choose a different name.';
      } else if (
        errorDetails.includes('name') &&
        (errorDetails.includes('too long') || errorDetails.includes('length'))
      ) {
        userMessage = `Monitor name must be between 1 and ${MONITOR_NAME_MAX_LENGTH} characters.`;
      } else if (
        errorDetails.includes('description') &&
        (errorDetails.includes('too long') || errorDetails.includes('length'))
      ) {
        userMessage = `Description must be ${MONITOR_DESCRIPTION_MAX_LENGTH} characters or less.`;
      } else if (errorDetails.includes('invalid query') || errorDetails.includes('query syntax')) {
        userMessage = 'The PPL query syntax is invalid. Please check your query.';
      } else if (errorDetails.includes('index') && errorDetails.includes('not found')) {
        userMessage = 'The specified index does not exist. Please check your query.';
      } else if (errorDetails.includes('permission') || errorDetails.includes('unauthorized')) {
        userMessage = 'You do not have permission to create monitors.';
      } else if (rawErrorMessage) {
        userMessage = rawErrorMessage;
      }

      this.setState({ submitError: userMessage });

      // Show toast notification
      services.notifications.toasts.addDanger({
        title: 'Failed to create monitor',
        text: userMessage,
      });
      
      formikBag.setSubmitting(false);
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  validateForm = (values: any) => {
    const errors: any = {};

    // Validate monitor name
    if (!values.name || values.name.trim() === '') {
      errors.name = 'Monitor name is required.';
    } else if (values.name.length > MONITOR_NAME_MAX_LENGTH) {
      errors.name = `Monitor name must be ${MONITOR_NAME_MAX_LENGTH} characters or less.`;
    }

    // Validate PPL query
    if (!values.pplQuery || values.pplQuery.trim() === '') {
      errors.pplQuery = 'PPL query is required.';
    }

    // Validate description length
    if (values.description && values.description.length > MONITOR_DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must be ${MONITOR_DESCRIPTION_MAX_LENGTH} characters or less.`;
    }

    const useLookBackWindow =
      values.useLookBackWindow !== undefined ? values.useLookBackWindow : true;
    if (useLookBackWindow) {
      const rawAmount = values.lookBackAmount === '' ? NaN : Number(values.lookBackAmount);
      const lookBackUnit = values.lookBackUnit || 'hours';
      const lookBackMinutes = Number.isNaN(rawAmount)
        ? NaN
        : lookBackUnit === 'minutes'
        ? rawAmount
        : lookBackUnit === 'hours'
        ? rawAmount * 60
        : rawAmount * 1440;

      if (
        Number.isNaN(rawAmount) ||
        rawAmount <= 0 ||
        lookBackMinutes < LOOKBACK_WINDOW_MIN_MINUTES
      ) {
        errors.lookBackAmount = `Look back window must be at least ${LOOKBACK_WINDOW_MIN_MINUTES} minute.`;
      }
    }

    // Validate triggers if they exist
    if (values.triggerDefinitions && Array.isArray(values.triggerDefinitions)) {
      values.triggerDefinitions.forEach((trigger: any, index: number) => {
        // Check if trigger has a condition that's too high (common issue)
        if (trigger.type === 'number_of_results' && trigger.num_results_value) {
          const threshold = Number(trigger.num_results_value);
          if (threshold > 10000) {
            if (!errors.triggerDefinitions) errors.triggerDefinitions = [];
            errors.triggerDefinitions[index] = {
              num_results_value: 'Threshold value should not exceed 10,000 for better performance',
            };
          }
        }
      });
    }

    return errors;
  };

  buildMonitorForTriggers = (values: any) => {
    const triggers = _.cloneDeep(values.triggerDefinitions || []);
    const rawIndices = Array.isArray(values.index)
      ? values.index.map((entry: any) => entry?.value || entry?.label).filter(Boolean)
      : [];
    const indices = rawIndices.length ? rawIndices : ['*'];

    return {
      name: values.name || '',
      type: 'monitor',
      monitor_type: MONITOR_TYPE.QUERY_LEVEL,
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
        search: { searchType: 'query' },
        triggers: {},
      },
      triggers,
      ppl_monitor: {
        query: values.pplQuery || '',
        triggers,
      },
    };
  };

  renderPplDetailsBody = (values: any, setFieldValue: any) => (
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
            rows={1}
            resize="vertical"
          />
          {values.description && (
            <EuiText size="xs" color="subdued" style={{ marginTop: '4px' }}>
              {values.description.length} / 500 characters
            </EuiText>
          )}
        </>
      </EuiFormRow>
    </>
  );

  renderPplQueryBody = (values: any, setFieldValue: any) => (
    <>
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" gutterSize="s" responsive={false}>
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
          <EuiSmallButton
            onClick={async () => {
              const httpClient = getClient();
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
                  dataSourceId: values.dataSourceId || this.props.dependencies.query.dataset?.dataSource?.id,
                });
                if ((data as any)?.ok === false) {
                  this.setState({
                    previewError:
                      (data as any).error || 'Incorrect data source or invalid query',
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
              } catch (e: any) {
                const errorMessage =
                  e?.body?.message || e?.message || 'Incorrect data source or invalid query';
                let userFriendlyMessage = errorMessage;

                // Provide user-friendly error messages for common issues
                if (errorMessage.includes('syntax') || errorMessage.includes('parse')) {
                  userFriendlyMessage = 'Invalid PPL query syntax. Please check your query.';
                } else if (errorMessage.includes('index') && errorMessage.includes('not found')) {
                  userFriendlyMessage = 'Index not found. Please verify the index name in your query.';
                } else if (errorMessage.includes('timeout')) {
                  userFriendlyMessage = 'Query execution timed out. Try reducing the time range or simplifying the query.';
                }

                this.setState({
                  previewError: userFriendlyMessage,
                  previewLoading: false,
                  previewOpen: true,
                });
              }
            }}
            isLoading={this.state.previewLoading}
            data-test-subj="runPreview"
          >
            Run preview
          </EuiSmallButton>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />

      <div data-test-subj="pplEditorMonaco">
        <QueryEditor
          value={values.pplQuery || ''}
          onChange={(text: string) => {
            if (text.length <= 10000) {
              setFieldValue('pplQuery', text);

              try {
                const queryString = this.props.services?.data?.query?.queryString;
                if (queryString) {
                  queryString.setQuery({
                    query: text,
                    language: 'PPL',
                  });
                }
              } catch (err) {
                // Silent fail
              }

              this.debouncedDetectTimestampFields(text);
            }
          }}
          services={this.props.services}
          height={80}
          indices={this.state.indices}
          autoExpand={true}
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
            <EuiEmptyPrompt iconType="editorCodeBlock" title={<h3>Run a query to view results</h3>} />
          ) : this.state.previewError ? (
            <EuiCodeBlock isCopyable>{this.state.previewError}</EuiCodeBlock>
          ) : (
            <AlertingDataTable
              pplResponse={this.state.previewResult}
              isLoading={this.state.previewLoading}
              services={this.props.services}
            />
          )}
        </EuiPanel>
      </EuiAccordion>
    </>
  );

  renderPplScheduleBody = (values: any, setFieldValue: any, errors: any) => {
    const useLB = values.useLookBackWindow !== undefined ? values.useLookBackWindow : true;
    const lbAmount = Number(values.lookBackAmount !== undefined ? values.lookBackAmount : 1);
    const lbUnit = values.lookBackUnit || 'hours';
    const { availableDateFields, dateFieldsError, dateFieldsLoading } = this.state;

    const LIMITS = {
      lookback: { min: LOOKBACK_WINDOW_MIN_MINUTES },
      interval: { min: 1 },
    };

    const lbMinutes =
      lbUnit === 'minutes' ? lbAmount : lbUnit === 'hours' ? lbAmount * 60 : lbAmount * 1440;
    const lookBackAmountValidationError = errors?.lookBackAmount as string | undefined;
    const lbError =
      useLB &&
      (Number.isNaN(lbAmount) || lbAmount <= 0 || (lbAmount > 0 && lbMinutes < LIMITS.lookback.min));
    const lbErrorMessage =
      lookBackAmountValidationError ||
      (lbError ? `Look back window must be at least ${LIMITS.lookback.min} minute.` : undefined);

    const intervalAmount = Number(values.period?.interval ?? 1);
    const intervalUnit = values.period?.unit || 'MINUTES';
    const intervalMinutes = intervalUnit === 'MINUTES' ? intervalAmount : intervalUnit === 'HOURS' ? intervalAmount * 60 : intervalAmount * 1440;
    const intervalError = intervalAmount > 0 && intervalMinutes < LIMITS.interval.min;

    const LookBackControls = (
      <>
        <EuiFormRow>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} style={{ marginLeft: '-4px' }}>
            <EuiFlexItem grow={false}>
              <EuiCheckbox
                id="useLookBackWindow"
                label={null}
                aria-label="Add look back window"
                checked={useLB && !(dateFieldsError && availableDateFields.length === 0)}
                onChange={(e) => {
                  if (dateFieldsError && availableDateFields.length === 0) {
                    setFieldValue('useLookBackWindow', false);
                  } else {
                    setFieldValue('useLookBackWindow', e.target.checked);
                  }
                }}
                data-test-subj="pplUseLookBack"
                disabled={dateFieldsError !== null && availableDateFields.length === 0}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s" style={{ display: 'inline-flex', alignItems: 'center' }}>
                Add look back window&nbsp;
                <EuiIconTip
                  type="iInCircle"
                  content="Look back window specifies how far back in time the monitor should query data during each execution."
                />
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>

        {dateFieldsError && availableDateFields.length === 0 && (
          <>
            <EuiSpacer size="s" />
            <EuiText size="xs" color="warning">
              <EuiIconTip type="alert" color="warning" /> Look back window requires a common timestamp field across all indices
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
              isInvalid={Boolean(lbErrorMessage)}
              error={lbErrorMessage}
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
                    isInvalid={Boolean(lbErrorMessage)}
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
                    : [{ value: values.timestampField || '@timestamp', text: values.timestampField || '@timestamp' }]
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
              <a
                href="https://docs.opensearch.org/latest/observing-your-data/alerting/cron/"
                target="_blank"
                rel="noopener noreferrer"
                className="euiLink"
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                Use cron expressions for complex schedules
                <EuiIcon
                  type="popout"
                  size="s"
                  color="primary"
                  style={{ marginLeft: 4 }}
                  aria-hidden="true"
                />
              </a>
            </EuiText>
            <EuiSpacer size="m" />
          </>
        )}
        {LookBackControls}
      </>
    );
  };

  render() {
    const { closeFlyout, dependencies, services } = this.props;
    const { isSubmitting, submitError, plugins, pluginsLoading } = this.state;

    // Clean up the query by removing backticks from index names
    // Explore plugin adds backticks like: source = `test` but we need: source = test
    const cleanQuery = (dependencies.queryInEditor || '').replace(/`([^`]+)`/g, '$1');

    const initialValues = {
      ..._.cloneDeep(FORMIK_INITIAL_VALUES),
      pplQuery: dependencies.queryInEditor || '',
      monitor_mode: 'ppl',
      searchType: SEARCH_TYPE.QUERY,
      monitor_type: MONITOR_TYPE.QUERY_LEVEL,
      dataSourceId: dependencies.query.dataset?.dataSource?.id || '',
      name: '', // Don't auto-populate, let user enter a meaningful name
      index: dependencies.query.dataset?.title ? [{ label: dependencies.query.dataset.title }] : [],
      useLookBackWindow: true,
      lookBackAmount: 1,
      lookBackUnit: 'hours',
      timestampField: '@timestamp',
    };

    return (
      <Provider store={this.store}>
        <EuiFlyout onClose={closeFlyout} size="l" ownFocus maxWidth={800}>
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2>Create monitor</h2>
            </EuiTitle>
          </EuiFlyoutHeader>

          <Formik
            innerRef={this.formikRef}
            initialValues={initialValues}
            validate={this.validateForm}
            onSubmit={this.handleSubmit}
            validateOnChange={true}
            validateOnMount
            enableReinitialize={false}
          >
            {({
              values,
              errors,
              handleSubmit,
              isSubmitting: formikSubmitting,
              touched,
              isValid,
              dirty,
              setFieldValue,
              submitCount,
            }) => {
              const safeMonitor = this.buildMonitorForTriggers(values);
              const safeTriggers = _.get(safeMonitor, 'triggers', []);
              const httpClient = getClient();

              return (
                <>
                  <EuiFlyoutBody className="create-monitor-flyout">
                    {submitError && (
                      <>
                        <EuiCallOut title="Error creating monitor" color="danger" iconType="alert">
                          <p>{submitError}</p>
                        </EuiCallOut>
                        <EuiSpacer />
                      </>
                    )}

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
                          children: this.renderPplScheduleBody(values, setFieldValue, errors),
                        },
                        {
                          title: 'Triggers',
                          children: (
                            <FieldArray name="triggerDefinitions" validateOnChange>
                              {(triggerArrayHelpers) => (
                                <ConfigureTriggersPpl
                                  edit={false}
                                  triggerArrayHelpers={triggerArrayHelpers}
                                  monitor={safeMonitor}
                                  monitorValues={values}
                                  touched={touched}
                                  setFlyout={() => {}}
                                  triggers={safeTriggers}
                                  triggerValues={values}
                                  isDarkMode={false}
                                  httpClient={httpClient}
                                  notifications={services.notifications}
                                  notificationService={this.notificationService}
                                  plugins={plugins}
                                  pluginsLoading={pluginsLoading}
                                  submitCount={submitCount}
                                  errors={errors}
                                />
                              )}
                            </FieldArray>
                          ),
                        },
                      ]}
                    />
                  </EuiFlyoutBody>

                  <EuiFlyoutFooter>
                    <EuiFlexGroup justifyContent="spaceBetween">
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty onClick={closeFlyout} flush="left">
                          Cancel
                        </EuiButtonEmpty>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButton
                          onClick={() => handleSubmit()}
                          fill
                          isLoading={isSubmitting || formikSubmitting}
                          isDisabled={formikSubmitting || isSubmitting || !isValid || !dirty}
                        >
                          Create
                        </EuiButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlyoutFooter>
                </>
              );
            }}
          </Formik>
        </EuiFlyout>
      </Provider>
    );
  }
}
