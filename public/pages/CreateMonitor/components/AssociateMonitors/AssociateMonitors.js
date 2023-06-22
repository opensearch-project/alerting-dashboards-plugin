/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { EuiSpacer, EuiText } from '@elastic/eui';
import MonitorsList from './components/MonitorsList';
import { FormikCodeEditor } from '../../../../components/FormControls';
import * as _ from 'lodash';
import { isInvalid, hasError, validateExtractionQuery } from '../../../../utils/validate';

const AssociateMonitors = ({
  monitors,
  options,
  searchType = 'graph',
  isDarkMode,
  monitorValues,
}) => {
  const [graphUi, setGraphUi] = useState(searchType === 'graph');

  const queryTemplate = {
    sequence: {
      delegates: [],
    },
  };

  const delegatesToMonitors = (value) =>
    value.sequence.delegates.map((monitor) => ({
      label: '',
      value: monitor.monitor_id,
    }));

  useEffect(() => {
    if (monitors?.length) {
      const value = { ...queryTemplate };
      monitors.map((monitor, idx) => {
        let delegate = {
          order: idx + 1,
          monitor_id: monitor.monitor_id,
        };
        value.sequence.delegates.push(delegate);
        _.set(monitorValues, `associatedMonitor_${idx}`, {
          label: monitor.monitor_name || '',
          value: monitor.monitor_id,
        });
      });

      _.set(monitorValues, 'associatedMonitorsEditor', JSON.stringify(value, null, 4));
      _.set(monitorValues, 'associatedMonitors', delegatesToMonitors(value));
    } else {
      if (options?.length && !graphUi) {
        const value = { ...queryTemplate };
        const firstTwo = options.slice(0, 2);
        firstTwo.map((monitor, idx) => {
          value.sequence.delegates.push({
            order: idx + 1,
            monitor_id: monitor.monitor_id,
          });
        });

        try {
          _.set(monitorValues, 'associatedMonitorsEditor', JSON.stringify(value, null, 4));
          _.set(monitorValues, 'associatedMonitors', delegatesToMonitors(value));
        } catch (e) {
          console.log('No monitor options are available.');
        }
      }
    }

    setGraphUi(searchType === 'graph');
  }, [searchType, monitors, options]);

  const onCodeChange = useCallback(
    (query, field, form) => {
      form.setFieldValue('associatedMonitorsEditor', query);
      try {
        const code = JSON.parse(query);
        form.setFieldValue('associatedMonitors', delegatesToMonitors(code));
      } catch (e) {
        console.error('Invalid json.');
      }
    },
    [options, monitors]
  );

  return (
    <Fragment>
      <EuiText size={'m'} style={{ paddingBottom: '0px', marginBottom: '0px' }}>
        <h4>Associate monitors</h4>
      </EuiText>
      <EuiText color={'subdued'} size={'xs'}>
        Associate two or more monitors to run as part of this workflow.
      </EuiText>

      <EuiSpacer size="m" />

      {graphUi ? (
        <MonitorsList monitors={monitors} options={options} />
      ) : (
        <FormikCodeEditor
          name="associatedMonitorsEditor"
          formRow
          fieldProps={{
            validate: validateExtractionQuery,
          }}
          rowProps={{
            label: 'Define workflow',
            fullWidth: true,
            isInvalid,
            error: hasError,
          }}
          inputProps={{
            mode: 'json',
            width: '80%',
            height: '300px',
            theme: isDarkMode ? 'sense-dark' : 'github',
            onChange: onCodeChange,
            onBlur: (e, field, form) => form.setFieldTouched('associatedMonitorsEditor', true),
            'data-test-subj': 'associatedMonitorsCodeEditor',
          }}
        />
      )}
    </Fragment>
  );
};

export default AssociateMonitors;
