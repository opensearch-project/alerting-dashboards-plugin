/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { EuiSpacer, EuiText, EuiRadioGroup } from '@elastic/eui';
import { Field } from 'formik';
import { PplAlertingVisualGraph } from '../../CreateMonitor/components/VisualGraph/PplAlertingVisualGraph';
import TriggerExpressionsPpl from './TriggerExpressions/TriggerExpressionsPpl';

const TriggerGraphPpl = ({
  monitorValues,
  response = {},
  thresholdValue,
  thresholdEnum,
  fieldPath,
  flyoutMode,
  hideThresholdControls = false,
  showModeSelector = false,
  errorMessage,
  thresholdFieldName = 'thresholdValue',
}) => {
  const hasSetInitialThreshold = useRef(false);
  const [graphKey, setGraphKey] = useState(0);
  const formikHelperRef = useRef(null);

  useEffect(() => {
    setGraphKey((prev) => prev + 1);
  }, [thresholdValue]);

  const handleMaxYValueCalculated = useCallback(
    (maxY) => {
      const thresholdNumericValue = Number(thresholdValue);
      const thresholdUnset =
        thresholdValue === undefined ||
        thresholdValue === null ||
        thresholdValue === '' ||
        Number.isNaN(thresholdNumericValue) ||
        thresholdNumericValue <= 0 ||
        thresholdValue === 10000;

      if (
        !hasSetInitialThreshold.current &&
        thresholdUnset &&
        maxY > 0 &&
        formikHelperRef.current
      ) {
        formikHelperRef.current.setValue(Math.ceil(maxY));
        hasSetInitialThreshold.current = true;
      }
    },
    [thresholdValue]
  );

  const graphBuckets = useMemo(() => {
    // Try common agg names. If still empty, tolerate total-only responses by faking a flat line.
    let buckets =
      _.get(response, 'aggregations.date_histogram.buckets') ||
      _.get(response, 'aggregations.counts.buckets') ||
      _.get(response, 'aggregations.count_over_time.buckets') ||
      _.get(response, 'aggregations.combined_value.buckets') ||
      _.get(response, 'aggregations.ppl_histogram.buckets') ||
      [];

    // Only synthesize a placeholder when the response truly has no agg data.
    const shouldSynthesizeBuckets = !response || !response.aggregations;

    if ((!buckets || buckets.length === 0) && shouldSynthesizeBuckets) {
      const now = Date.now();
      buckets = [{ key: now, doc_count: 0 }];
    }

    return buckets || [];
  }, [response]);

  const total = useMemo(
    () =>
      _.get(response, 'hits.total.value') ??
      (_.get(response, 'total') !== undefined ? _.get(response, 'total') : undefined),
    [response]
  );

  const graphResponse = useMemo(() => {
    const response = {
      hits: total != null ? { total: { value: Number(total) || 0, relation: 'eq' } } : undefined,
      aggregations: {
        count_over_time: { buckets: graphBuckets },
        combined_value: { buckets: graphBuckets },
        date_histogram: { buckets: graphBuckets },
        ppl_histogram: { buckets: graphBuckets },
      },
    };

    return response;
  }, [graphBuckets, total]);

  return (
    <div style={{ marginBottom: 0 }}>
      <Field name={`${fieldPath}${thresholdFieldName}`}>
        {({ field, form }) => {
          useEffect(() => {
            if (!formikHelperRef.current) {
              formikHelperRef.current = {
                setValue: (val) => form.setFieldValue(field.name, val, false),
              };
            }
            return () => {
              formikHelperRef.current = null;
            };
          }, [form, field.name]);

          useEffect(() => {
            if (hasSetInitialThreshold.current) return;
            const numericValue = Number(field.value);
            if (Number.isFinite(numericValue) && numericValue > 0) {
              hasSetInitialThreshold.current = true;
              return;
            }

            if (!Array.isArray(graphBuckets) || graphBuckets.length === 0) return;

            const maxBucket = Math.max(...graphBuckets.map((b) => Number(b?.doc_count || 0)), 0);
            if (maxBucket > 0) {
              form.setFieldValue(field.name, maxBucket, false);
              hasSetInitialThreshold.current = true;
            }
          }, [field.value, form, field.name, graphBuckets]);

          return null;
        }}
      </Field>

      {!hideThresholdControls && (
        <TriggerExpressionsPpl
          thresholdValue={thresholdValue}
          thresholdEnum={thresholdEnum}
          keyFieldName={`${fieldPath}thresholdEnum`}
          valueFieldName={`${fieldPath}${thresholdFieldName}`}
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

      <PplAlertingVisualGraph
        key={graphKey}
        values={monitorValues}
        thresholdValue={thresholdValue}
        response={graphResponse}
        services={{}}
        onMaxYValueCalculated={handleMaxYValueCalculated}
      />
    </div>
  );
};

TriggerGraphPpl.propTypes = {
  monitorValues: PropTypes.object,
  response: PropTypes.any,
  thresholdValue: PropTypes.any,
  thresholdEnum: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.object]),
  fieldPath: PropTypes.string,
  flyoutMode: PropTypes.bool,
  hideThresholdControls: PropTypes.bool,
  showModeSelector: PropTypes.bool,
  errorMessage: PropTypes.string,
  thresholdFieldName: PropTypes.string,
};

export default TriggerGraphPpl;
