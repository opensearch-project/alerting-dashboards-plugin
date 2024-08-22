/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { Field } from 'formik';
import {
  EuiSmallButton,
  EuiCompressedFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCompressedFormRow,
  EuiCompressedSelect,
} from '@elastic/eui';
import { AND_OR_CONDITION_OPTIONS, THRESHOLD_ENUM_OPTIONS } from '../../utils/constants';

export const Expressions = { THRESHOLD: 'THRESHOLD' };

const GUTTER_WIDTH = 16;
const AND_OR_FIELD_WIDTH = 90;
const METRIC_FIELD_WIDTH = 300;
const THRESHOLD_FIELD_WIDTH = 200;
const VALUE_FIELD_WIDTH = 200;

class BucketLevelTriggerExpression extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      arrayHelpers,
      queryMetrics,
      index,
      andOrConditionFieldName,
      queryMetricFieldName,
      enumFieldName,
      valueFieldName,
    } = this.props;
    const isFirstCondition = index === 0;
    return (
      <EuiFlexGroup
        style={{
          maxWidth: 1200,
          paddingLeft: '10px',
          paddingTop: '10px',
          whiteSpace: 'nowrap',
        }}
        gutterSize={'m'}
        alignItems={'flexStart'}
      >
        {!isFirstCondition ? (
          <EuiFlexItem grow={false} style={{ width: `${AND_OR_FIELD_WIDTH}px` }}>
            <Field name={andOrConditionFieldName}>
              {({ field: { onBlur, ...rest }, form: { touched, errors } }) => (
                <EuiCompressedFormRow
                  isInvalid={touched.andOrCondition && !!errors.andOrCondition}
                  error={errors.andOrCondition}
                >
                  <EuiCompressedSelect options={AND_OR_CONDITION_OPTIONS} {...rest} />
                </EuiCompressedFormRow>
              )}
            </Field>
          </EuiFlexItem>
        ) : null}

        <EuiFlexItem
          grow={false}
          style={{
            minWidth: isFirstCondition
              ? `${METRIC_FIELD_WIDTH + AND_OR_FIELD_WIDTH + GUTTER_WIDTH}px`
              : `${METRIC_FIELD_WIDTH}px`,
          }}
        >
          <Field name={queryMetricFieldName} fullWidth={true}>
            {({ field: { onBlur, ...rest }, form: { touched, errors } }) => (
              <EuiCompressedFormRow
                fullWidth={true}
                label={isFirstCondition ? 'Metric' : null}
                isInvalid={touched.queryMetric && !!errors.queryMetric}
                error={errors.queryMetric}
              >
                <EuiCompressedSelect fullWidth={true} options={queryMetrics} {...rest} />
              </EuiCompressedFormRow>
            )}
          </Field>
        </EuiFlexItem>

        <EuiFlexItem grow={false} style={{ width: `${THRESHOLD_FIELD_WIDTH}px` }}>
          <Field name={enumFieldName} fullWidth={true}>
            {({ field: { onBlur, ...rest }, form: { touched, errors } }) => (
              <EuiCompressedFormRow
                fullWidth={true}
                label={isFirstCondition ? 'Threshold' : null}
                isInvalid={touched.thresholdEnum && !!errors.thresholdEnum}
                error={errors.thresholdEnum}
              >
                <EuiCompressedSelect options={THRESHOLD_ENUM_OPTIONS} {...rest} />
              </EuiCompressedFormRow>
            )}
          </Field>
        </EuiFlexItem>

        <EuiFlexItem grow={false} style={{ width: `${VALUE_FIELD_WIDTH}px` }}>
          <Field name={valueFieldName}>
            {({ field, form: { touched, errors } }) => (
              <EuiCompressedFormRow
                label={isFirstCondition ? 'Value' : null}
                isInvalid={touched.thresholdValue && !!errors.thresholdValue}
                error={errors.thresholdValue}
              >
                <EuiCompressedFieldNumber {...field} />
              </EuiCompressedFormRow>
            )}
          </Field>
        </EuiFlexItem>
        {!isFirstCondition ? (
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              color={'danger'}
              onClick={() => {
                arrayHelpers.remove(index);
              }}
            >
              Remove condition
            </EuiSmallButton>
          </EuiFlexItem>
        ) : null}
      </EuiFlexGroup>
    );
  }
}

export default BucketLevelTriggerExpression;
