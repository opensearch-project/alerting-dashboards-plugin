/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { EuiSpacer, EuiText, EuiRadioGroup } from '@elastic/eui';
import { Field } from 'formik';
import { AlertingVisualGraph } from '../../CreateMonitor/components/VisualGraph/AlertingVisualGraph';
import TriggerExpressions from './TriggerExpressions';

/**
 * V2/PPL Trigger Graph Component
 * Uses the enhanced AlertingVisualGraph for PPL monitors with additional features
 */
const TriggerGraphV2 = ({
  monitorValues,
  response,
  thresholdValue,
  thresholdEnum,
  fieldPath,
  flyoutMode,
  hideThresholdControls = false,
  showModeSelector = false,
}) => {
  const hasSetInitialThreshold = useRef(false);
  const [graphKey, setGraphKey] = useState(0);
  const [formikHelperRef, setFormikHelperRef] = useState(null);
  
  // Force re-render of AlertingVisualGraph when thresholdValue changes
  useEffect(() => {
    setGraphKey(prev => prev + 1);
  }, [thresholdValue]);
  
  // Callback to set the default threshold value based on max Y value from data
  const handleMaxYValueCalculated = useCallback((maxY) => {
    // Only set the threshold automatically if:
    // 1. We haven't set it before for this trigger
    // 2. The current value is the default 10000
    // 3. maxY is a valid number greater than 0
    // 4. We have access to formik
    if (!hasSetInitialThreshold.current && thresholdValue === 10000 && maxY > 0 && formikHelperRef) {
      formikHelperRef.setValue(maxY);
      hasSetInitialThreshold.current = true;
    }
  }, [thresholdValue, formikHelperRef]);
  
  console.log('[TriggerGraphV2] Received response:', response);
  
  // Try common agg names. If still empty, tolerate total-only responses by faking a flat line.
  let buckets =
    _.get(response, 'aggregations.date_histogram.buckets') ||
    _.get(response, 'aggregations.counts.buckets') ||
    _.get(response, 'aggregations.count_over_time.buckets') ||
    _.get(response, 'aggregations.combined_value.buckets') ||
    _.get(response, 'aggregations.ppl_histogram.buckets') ||
    [];

  const total =
    _.get(response, 'hits.total.value') ??
    (_.get(response, 'total') !== undefined ? _.get(response, 'total') : undefined);

  console.log('[TriggerGraphV2] Extracted buckets:', buckets);
  console.log('[TriggerGraphV2] Extracted total:', total);

  // Only synthesize a placeholder when the response truly has no agg data.
  const shouldSynthesizeBuckets = !response || !response.aggregations;
  if ((!buckets || buckets.length === 0) && shouldSynthesizeBuckets) {
    const now = Date.now();
    buckets = [{ key: now, doc_count: 0 }];
    console.log('[TriggerGraphV2] No buckets found, synthesized placeholder bucket');
  }
  
  // Normalize into a VisualGraph-friendly shape:
  const graphResponse = {
    hits: total != null ? { total: { value: Number(total) || 0, relation: 'eq' } } : undefined,
    aggregations: {
      count_over_time: { buckets },
      combined_value: { buckets },
      date_histogram: { buckets },
      ppl_histogram: { buckets },
    },
  };
  
  console.log('[TriggerGraphV2] Final graphResponse:', graphResponse);
  console.log('[TriggerGraphV2] flyoutMode:', flyoutMode);
  console.log('[TriggerGraphV2] Will render graph:', !flyoutMode);

  return (
    <div style={flyoutMode ? {} : { padding: '0px 10px' }}>
      {/* Hidden field to get formik helper for auto-setting threshold */}
      <Field name={`${fieldPath}thresholdValue`}>
        {({ field, form }) => {
          // Use useEffect to capture formik helper without triggering setState during render
          useEffect(() => {
            if (!formikHelperRef) {
              setFormikHelperRef({
                setValue: (val) => form.setFieldValue(field.name, val, false)
              });
            }
          }, [form, field.name]);
          return null;
        }}
      </Field>
      
      {!hideThresholdControls && (
        <TriggerExpressions
          thresholdValue={thresholdValue}
          thresholdEnum={thresholdEnum}
          keyFieldName={`${fieldPath}thresholdEnum`}
          valueFieldName={`${fieldPath}thresholdValue`}
          label="Trigger condition"
          flyoutMode={flyoutMode}
        />
      )}

      {showModeSelector && (
        <>
          <EuiSpacer size="s" />
          <EuiText size="xs">
            <strong>Trigger</strong>
          </EuiText>
          <Field name={`${fieldPath}mode`}>
            {({ field, form }) => (
              <EuiRadioGroup
                options={[
                  { id: 'result_set', label: 'Once' },
                  { id: 'per_result', label: 'For each result' },
                ]}
                idSelected={field.value === 'per_result' ? 'per_result' : 'result_set'}
                onChange={(id) => form.setFieldValue(`${fieldPath}mode`, id)}
                data-test-subj="triggerMode"
              />
            )}
          </Field>
        </>
      )}

      {!flyoutMode && (
        <>
          {!hideThresholdControls && <EuiSpacer size="m" />}
          {console.log('[TriggerGraphV2] Rendering AlertingVisualGraph with:', { graphKey, thresholdValue, response: graphResponse })}
          <AlertingVisualGraph
            key={graphKey}
            values={monitorValues}
            thresholdValue={thresholdValue}
            response={graphResponse}
            services={{}}
            onMaxYValueCalculated={handleMaxYValueCalculated}
          />
        </>
      )}
    </div>
  );
};

TriggerGraphV2.propTypes = {
  monitorValues: PropTypes.object,
  response: PropTypes.any,
  thresholdValue: PropTypes.any,
  thresholdEnum: PropTypes.any,
  fieldPath: PropTypes.string,
  flyoutMode: PropTypes.bool,
  hideThresholdControls: PropTypes.bool,
  showModeSelector: PropTypes.bool,
};

export default TriggerGraphV2;

