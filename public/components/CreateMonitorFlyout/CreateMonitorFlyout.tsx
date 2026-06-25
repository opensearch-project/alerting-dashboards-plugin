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
  EuiSpacer,
  EuiCallOut,
  EuiFormRow,
  EuiFieldText,
  EuiTextArea,
  EuiText,
  EuiTextColor,
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
import { getClient, setDataSource, NotificationService } from '../../services';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../utils/constants';
import CustomSteps from '../../pages/CreateMonitor/components/CustomSteps';
import ConfigureTriggersPpl from '../../pages/CreateTrigger/containers/ConfigureTriggers/ConfigureTriggersPpl';
import {
  runPPLPreview,
  extractIndicesFromPPL,
  findCommonDateFields,
  getPlugins,
  makeAlertingV2Service,
} from '../../pages/CreateMonitor/containers/CreateMonitor/utils/pplAlertingHelpers';
import { buildPPLMonitorFromFormik } from '../../pages/CreateMonitor/containers/CreateMonitor/utils/pplFormikToMonitor';
import { buildPplMonitorForTriggers } from '../../utils/buildPplMonitorForTriggers';
import { PplQueryEditor } from '../../components/PplQueryEditor';
import { PplScheduleEditor } from '../../components/PplScheduleEditor';
import { CoreContext } from '../../utils/CoreContext';
import { getAlertingStore } from '../../redux';

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
          } catch (err) { /* no-op */ }
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

  runPreview = async (values: any) => {
    const httpClient = getClient();
    this.setState({ previewLoading: true, previewError: null, previewResult: null, previewQuery: '', previewOpen: true });
    try {
      const data = await runPPLPreview(httpClient, {
        queryText: values.pplQuery || '',
        dataSourceId: values.dataSourceId || this.props.dependencies.query.dataset?.dataSource?.id,
      });
      if ((data as any)?.ok === false) {
        this.setState({ previewError: (data as any).error || 'Incorrect data source or invalid query', previewLoading: false });
        return;
      }
      this.setState({ previewResult: data, previewQuery: values.pplQuery || '', previewLoading: false });
    } catch (e: any) {
      this.setState({ previewError: e?.body?.message || e?.message || 'Incorrect data source or invalid query', previewLoading: false });
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
    <PplQueryEditor
      pplQuery={values.pplQuery || ''}
      onQueryChange={(text) => {
        setFieldValue('pplQuery', text);
        try {
          this.props.services?.data?.query?.queryString?.setQuery({ query: text, language: 'PPL' });
        } catch (err) { /* silent */ }
        this.debouncedDetectTimestampFields(text);
      }}
      previewResult={this.state.previewResult}
      previewError={this.state.previewError}
      previewLoading={this.state.previewLoading}
      previewOpen={this.state.previewOpen}
      onPreviewToggle={(isOpen) => this.setState({ previewOpen: isOpen })}
      onRunPreview={() => this.runPreview(values)}
      editorHeight={80}
      autoExpand={true}
      services={this.props.services}
      indices={this.state.indices}
    />
  );

  renderPplScheduleBody = (values: any, setFieldValue: any, errors: any) => (
    <PplScheduleEditor
      frequency={values.frequency}
      period={values.period}
      cronExpression={values.cronExpression}
      useLookBackWindow={values.useLookBackWindow}
      lookBackAmount={values.lookBackAmount}
      lookBackUnit={values.lookBackUnit}
      timestampField={values.timestampField}
      setFieldValue={setFieldValue}
      availableDateFields={this.state.availableDateFields}
      dateFieldsError={this.state.dateFieldsError}
      dateFieldsLoading={this.state.dateFieldsLoading}
      errors={errors}
      wrapperStyle={{ marginLeft: '-6px', maxWidth: '720px' }}
    />
  );

  render() {
    const { closeFlyout, dependencies, services } = this.props;
    const { isSubmitting, submitError, plugins, pluginsLoading } = this.state;

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
            const safeMonitor = buildPplMonitorForTriggers(values);
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
                                flyoutMode={true}
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
      </Provider>
    );
  }
}
