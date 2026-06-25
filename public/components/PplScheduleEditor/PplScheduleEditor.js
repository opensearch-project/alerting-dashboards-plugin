/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiCheckbox,
  EuiFieldNumber,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiIconTip,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTextArea,
} from '@elastic/eui';

const LOOKBACK_WINDOW_MAX_MINUTES = 10080; // 7 days

const PplScheduleEditor = ({
  frequency,
  period,
  cronExpression,
  useLookBackWindow,
  lookBackAmount,
  lookBackUnit,
  timestampField,
  setFieldValue,
  availableDateFields,
  dateFieldsError,
  dateFieldsLoading,
  errors = {},
  isEdit = false,
  isMustang = false,
  wrapperStyle = { maxWidth: '720px' },
}) => {
  const useLB = isEdit ? false : useLookBackWindow !== undefined ? useLookBackWindow : true;
  const lbAmount = Number(lookBackAmount !== undefined ? lookBackAmount : 1);
  const lbUnit = lookBackUnit || 'hours';
  const lbMinutes =
    lbUnit === 'minutes' ? lbAmount : lbUnit === 'hours' ? lbAmount * 60 : lbAmount * 1440;
  const lbTooSmall = lbAmount !== '' && lbMinutes < 1;
  const lbTooLarge = lbAmount !== '' && lbMinutes > LOOKBACK_WINDOW_MAX_MINUTES;
  const lbError = lbTooSmall || lbTooLarge;

  const intervalAmount = Number(period?.interval ?? 1);
  const intervalUnit = period?.unit || 'MINUTES';
  const intervalMinutes =
    intervalUnit === 'MINUTES'
      ? intervalAmount
      : intervalUnit === 'HOURS'
      ? intervalAmount * 60
      : intervalAmount * 1440;
  const intervalError = intervalAmount !== '' && intervalMinutes < 1;

  const noDateFields = dateFieldsError !== null && availableDateFields.length === 0;

  return (
    <>
      <EuiFormRow label="Frequency" fullWidth style={wrapperStyle}>
        <EuiSelect
          data-test-subj="pplFrequency"
          options={[
            { value: 'interval', text: 'By interval' },
            { value: 'daily', text: 'Daily' },
            { value: 'weekly', text: 'Weekly' },
            { value: 'monthly', text: 'Monthly' },
            { value: 'cronExpression', text: 'Custom cron job' },
          ]}
          value={frequency}
          onChange={(e) => setFieldValue('frequency', e.target.value)}
          fullWidth
        />
      </EuiFormRow>

      {frequency === 'interval' && (
        <EuiFormRow
          label="Run every"
          fullWidth
          style={wrapperStyle}
          isInvalid={intervalError}
          error={intervalError ? 'Must be at least 1 minute' : undefined}
        >
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem>
              <EuiFieldNumber
                data-test-subj="pplIntervalValue"
                value={period?.interval === 0 ? '' : period?.interval ?? 1}
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
                value={period?.unit || 'MINUTES'}
                onChange={(e) => setFieldValue('period.unit', e.target.value)}
                fullWidth
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>
      )}

      {frequency === 'cronExpression' && (
        <>
          <EuiFormRow label="Run every" style={wrapperStyle}>
            <EuiTextArea
              data-test-subj="pplCronExpression"
              value={cronExpression || ''}
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

      {/*// TODO: investigate whether we can add back the lookback window component for mustang domains*/}
      {!isEdit && !isMustang && (
        <>
          <EuiFormRow
            fullWidth={true}
            helpText={
              'The look back window will be added to your PPL query as a "where" filter. After creating this monitor, that filter can be edited in the query itself.'
            }
          >
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
              checked={useLB && !noDateFields}
              onChange={(e) => {
                if (noDateFields) {
                  setFieldValue('useLookBackWindow', false);
                } else {
                  const checked = e.target.checked;
                  setFieldValue('useLookBackWindow', checked);
                  if (checked) {
                    if (lookBackAmount === undefined || lookBackAmount === null) {
                      setFieldValue('lookBackAmount', 1);
                    }
                    if (!lookBackUnit) {
                      setFieldValue('lookBackUnit', 'hours');
                    }
                  }
                }
              }}
              data-test-subj="pplUseLookBack"
              disabled={noDateFields}
            />
          </EuiFormRow>

          {noDateFields && (
            <>
              <EuiSpacer size="s" />
              <EuiText size="xs" color="warning">
                <EuiIconTip type="alert" color="warning" /> Look back window requires a common
                timestamp field across all indices
              </EuiText>
              <EuiSpacer size="s" />
            </>
          )}

          {useLB && !noDateFields && (
            <>
              <EuiFormRow
                label="Look back from"
                fullWidth
                style={wrapperStyle}
                isInvalid={lbError}
                error={
                  lbTooSmall
                    ? 'Must be at least 1 minute'
                    : lbTooLarge
                    ? 'Must be at most 7 days (10,080 minutes)'
                    : undefined
                }
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
                style={wrapperStyle}
                helpText={dateFieldsLoading ? 'Detecting timestamp fields...' : undefined}
              >
                <EuiSelect
                  data-test-subj="pplTimestampField"
                  options={(availableDateFields || []).map((field) => ({
                    value: field,
                    text: field,
                  }))}
                  hasNoInitialSelection={!timestampField}
                  value={timestampField || ''}
                  onChange={(e) => setFieldValue('timestampField', e.target.value)}
                  fullWidth
                  isLoading={dateFieldsLoading}
                />
              </EuiFormRow>
            </>
          )}
        </>
      )}
    </>
  );
};

export default PplScheduleEditor;
