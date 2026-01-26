/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSpacer, EuiSmallButtonIcon } from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel';
import _ from 'lodash';
import AddTriggerButtonPpl from '../../components/AddTriggerButton/AddTriggerButtonPpl';
import TriggerEmptyPrompt from '../../components/TriggerEmptyPrompt';
import { MAX_TRIGGERS } from '../../../MonitorDetails/containers/Triggers/Triggers';
import monitorToFormik from '../../../CreateMonitor/containers/CreateMonitor/utils/monitorToFormik';
import { backendErrorNotification, inputLimitText } from '../../../../utils/helpers';
import EnhancedAccordion from '../../../../components/FeatureAnywhereContextMenu/EnhancedAccordion';
import { getDataSourceQueryObj } from '../../../../../public/pages/utils/helpers';
import DefineTriggerPpl from '../DefineTrigger/DefineTriggerPpl';

const build1hSeriesFromTotal = (pplResp, now = Date.now()) => {
  const HOUR_MS = 60 * 60 * 1000;
  const FIVE_MIN_MS = 5 * 60 * 1000;
  const total = Number(pplResp?.total ?? pplResp?.datarows?.length ?? 0) || 0;

  // Create 12 buckets at 5-minute intervals over the last hour (matching Discover's behavior)
  // Start from 1 hour ago, rounded down to the nearest 5-minute interval
  const startTime = Math.floor((now - HOUR_MS) / FIVE_MIN_MS) * FIVE_MIN_MS;
  const buckets = [];

  // Create buckets for each 5-minute interval
  for (let i = 0; i < 12; i++) {
    const bucketTime = startTime + i * FIVE_MIN_MS;
    buckets.push({
      key: bucketTime,
      key_as_string: new Date(bucketTime).toISOString(),
      doc_count: 0, // Initialize all buckets to 0
    });
  }

  // Helper function to distribute counts to buckets based on timestamps
  const distributeCountsToBuckets = (datarows, getTimeValue) => {
    let distributedCount = 0;
    datarows.forEach((row) => {
      const timeValue = getTimeValue(row);
      if (timeValue) {
        let timestamp;
        if (typeof timeValue === 'number') {
          timestamp = timeValue;
        } else if (typeof timeValue === 'string') {
          timestamp = new Date(timeValue).getTime();
        } else {
          return; // Skip invalid timestamp
        }

        if (Number.isFinite(timestamp) && timestamp > 0) {
          // Find the bucket for this timestamp
          const bucketIndex = Math.floor((timestamp - startTime) / FIVE_MIN_MS);
          if (bucketIndex >= 0 && bucketIndex < buckets.length) {
            buckets[bucketIndex].doc_count++;
            distributedCount++;
          }
        }
      }
    });
    return distributedCount;
  };

  // Try to distribute counts based on actual data timestamps if available
  const datarows = pplResp?.datarows || [];
  let distributedCount = 0;

  if (datarows.length > 0) {
    // Try to find a time field in the datarows
    const timeFieldNames = ['@timestamp', 'timestamp', 'time', '_time', 'logtime'];

    // Check first row for time field
    if (datarows[0] && Array.isArray(datarows[0])) {
      // If datarows is array of arrays, check schema or first few rows
      const schema = pplResp?.schema || [];
      const timeFieldIndex = schema.findIndex((col, idx) =>
        timeFieldNames.some(
          (name) =>
            (col.name && col.name.toLowerCase().includes(name.toLowerCase())) ||
            (col.alias && col.alias.toLowerCase().includes(name.toLowerCase()))
        )
      );

      if (timeFieldIndex >= 0 && datarows[0][timeFieldIndex]) {
        // Distribute counts to buckets based on timestamps
        distributedCount = distributeCountsToBuckets(datarows, (row) => row[timeFieldIndex]);
      }
    } else if (datarows[0] && typeof datarows[0] === 'object') {
      // If datarows is array of objects, find time field
      const timeField = timeFieldNames.find((name) => datarows[0][name] !== undefined);

      if (timeField) {
        distributedCount = distributeCountsToBuckets(datarows, (row) => row[timeField]);
      }
    }
  }

  // If we couldn't distribute based on timestamps, put total in the most recent bucket
  if (distributedCount === 0 && total > 0) {
    // Put total in the most recent bucket (last bucket)
    buckets[buckets.length - 1].doc_count = total;
  }

  const normalized = {
    hits: { total: { value: total, relation: 'eq' } },
    aggregations: {
      ppl_histogram: { buckets },
      count_over_time: { buckets },
      date_histogram: { buckets },
      combined_value: { buckets },
    },
  };

  return normalized;
};

class ConfigureTriggersPpl extends React.Component {
  constructor(props) {
    super(props);

    const firstTriggerId = _.get(props.triggerValues, 'triggerDefinitions[0].id');
    const startTriggerIndex = 0;
    const accordionsOpen = firstTriggerId ? { [startTriggerIndex]: true } : {};

    this.state = {
      executeResponse: null,
      previewError: null,
      accordionsOpen,
      TriggerContainer: props.flyoutMode
        ? (p) => <EnhancedAccordion {...p} />
        : ({ children }) => <>{children}</>,
      ContentPanelStructure: props.flyoutMode ? ({ children }) => <>{children}</> : ContentPanel,
    };
  }

  componentDidMount() {
    this.onRunExecute(this.props.monitorValues);
  }

  prepareAddTriggerButton = () => {
    const { monitorValues, triggerArrayHelpers, triggerValues } = this.props;
    const disableAddTriggerButton =
      _.get(triggerValues, 'triggerDefinitions', []).length >= MAX_TRIGGERS;
    return (
      <AddTriggerButtonPpl arrayHelpers={triggerArrayHelpers} disabled={disableAddTriggerButton} />
    );
  };

  prepareTriggerEmptyPrompt = () => {
    const { monitorValues, triggerArrayHelpers, flyoutMode } = this.props;
    return (
      <TriggerEmptyPrompt
        arrayHelpers={triggerArrayHelpers}
        monitorType={monitorValues.monitor_type}
        flyoutMode={flyoutMode}
      />
    );
  };

  onRunExecute = (formikValuesArg) => {
    const { httpClient, monitor, notifications } = this.props;
    const formikValues = formikValuesArg || monitorToFormik(monitor);

    const baseQuery = formikValues?.pplQuery || monitor?.ppl_monitor?.query || monitor?.query || '';

    const customCondition =
      typeof formikValuesArg?.customCondition === 'string'
        ? formikValuesArg.customCondition.trim()
        : '';

    let pplQuery = baseQuery;
    if (customCondition) {
      const conditionFragment = customCondition.startsWith('|')
        ? customCondition
        : `| ${customCondition}`;
      pplQuery = `${baseQuery} ${conditionFragment}`.trim();
    }

    let dataSourceQuery = {};
    try {
      dataSourceQuery = getDataSourceQueryObj() || {};
    } catch (err) {
      dataSourceQuery = {};
    }

    httpClient
      .post('/_plugins/_ppl', {
        body: JSON.stringify({ query: pplQuery }),
        query: dataSourceQuery?.query,
      })
      .then((resp) => {
        if (resp.ok) {
          const now = Date.now();
          const pplResp = resp.resp;

          // Check if response already has buckets (from time-based aggregations like span)
          const existingBuckets =
            _.get(pplResp, 'aggregations.date_histogram.buckets') ||
            _.get(pplResp, 'aggregations.counts.buckets') ||
            _.get(pplResp, 'aggregations.count_over_time.buckets') ||
            _.get(pplResp, 'aggregations.combined_value.buckets') ||
            _.get(pplResp, 'aggregations.ppl_histogram.buckets') ||
            [];

          // Only normalize if there are no existing buckets
          const normalized =
            existingBuckets && existingBuckets.length > 0
              ? pplResp
              : build1hSeriesFromTotal(pplResp, now);

          const wrapped = {
            ok: true,
            period_start: now - 60 * 60 * 1000,
            period_end: now,
            input_results: { results: [normalized] },
            error: null,
          };

          this.setState({ executeResponse: wrapped, previewError: null });
        } else {
          this.setState({
            executeResponse: null,
            previewError: resp?.resp?.message || 'Incorrect data source or invalid query',
          });
        }
      })
      .catch(() => {
        this.setState({
          executeResponse: null,
          previewError: 'Incorrect data source or invalid query',
        });
      });
  };

  renderDefineTrigger = (triggerArrayHelpers, index) => {
    const {
      edit,
      monitor,
      monitorValues,
      notifications,
      setFlyout,
      triggers,
      triggerValues,
      isDarkMode,
      httpClient,
      notificationService,
      plugins,
      pluginsLoading,
      flyoutMode,
      submitCount,
      errors,
    } = this.props;
    const { executeResponse, previewError } = this.state;
    return (
      <DefineTriggerPpl
        edit={edit}
        triggerArrayHelpers={triggerArrayHelpers}
        executeResponse={executeResponse}
        previewError={previewError}
        monitor={monitor}
        monitorValues={monitorValues}
        onRun={(fv) => this.onRunExecute(fv || monitorValues)}
        setFlyout={setFlyout}
        triggers={triggers}
        triggerValues={triggerValues}
        isDarkMode={isDarkMode}
        triggerIndex={index}
        httpClient={httpClient}
        notifications={notifications}
        notificationService={notificationService}
        plugins={plugins}
        pluginsLoading={pluginsLoading}
        flyoutMode={flyoutMode}
        submitCount={submitCount}
        errors={errors}
      />
    );
  };

  renderTriggers() {
    const { triggerValues, triggerArrayHelpers, flyoutMode } = this.props;
    const { accordionsOpen } = this.state;

    return _.get(triggerValues, 'triggerDefinitions', []).map((trigger, index) => {
      const id = _.get(trigger, 'id', index);
      const TriggerContainer = this.state.TriggerContainer;

      return (
        <TriggerContainer
          key={id}
          id={`${id}`}
          title={trigger.name || `Trigger ${index + 1}`}
          extraActions={
            flyoutMode ? (
              <EuiSmallButtonIcon
                aria-label="Delete trigger"
                iconType="trash"
                color="danger"
                onClick={() => {
                  triggerArrayHelpers.remove(index);
                }}
              />
            ) : undefined
          }
          isOpen={flyoutMode ? accordionsOpen[index] : true}
          onToggle={
            flyoutMode
              ? () =>
                  this.setState({
                    accordionsOpen: { ...accordionsOpen, [index]: !accordionsOpen[index] },
                  })
              : undefined
          }
        >
          {this.renderDefineTrigger(triggerArrayHelpers, index)}
          <EuiSpacer size="m" />
        </TriggerContainer>
      );
    });
  }

  render() {
    const { flyoutMode, triggerValues } = this.props;
    const { ContentPanelStructure } = this.state;
    const numTriggers = _.get(triggerValues, 'triggerDefinitions', []).length;
    const hasTriggers = numTriggers > 0;
    const addTriggerButton = this.prepareAddTriggerButton();
    const triggerEmptyPrompt = this.prepareTriggerEmptyPrompt();
    const headerActions = !flyoutMode ? addTriggerButton : undefined;

    return (
      <ContentPanelStructure
        title={`Triggers (${numTriggers})`}
        titleSize="s"
        bodyStyles={{ padding: 'initial' }}
        actions={headerActions}
      >
        {hasTriggers ? this.renderTriggers() : triggerEmptyPrompt}

        {flyoutMode && (
          <>
            <EuiSpacer size="m" />
            {addTriggerButton}
          </>
        )}

        {!flyoutMode && hasTriggers && (
          <>
            <EuiSpacer size="m" />
            {inputLimitText(numTriggers, MAX_TRIGGERS, 'trigger', 'triggers')}
          </>
        )}
      </ContentPanelStructure>
    );
  }
}

export default ConfigureTriggersPpl;
