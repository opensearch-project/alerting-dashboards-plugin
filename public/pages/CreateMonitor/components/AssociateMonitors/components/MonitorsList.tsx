/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState, useEffect } from 'react';
import * as _ from 'lodash';
import {
  EuiButton,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import {
  FormikComboBox,
  FormikInputWrapper,
  FormikFormRow,
} from '../../../../../components/FormControls';

const MonitorsList = ({ monitors = [], options = [], values }) => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [monitorOptions, setMonitorOptions] = useState([]);

  const [monitorFields, setMonitorFields] = useState<number[]>(
    _.reduce(
      monitors.length ? monitors : [0, 1],
      (result, value, key) => {
        result.push(key);
        return result;
      },
      []
    )
  );

  useEffect(() => {
    const newOptions = [...options].map((monitor) => ({
      label: monitor.monitor_name,
      value: monitor.monitor_id,
    }));
    setMonitorOptions(newOptions);

    // let newSelected = monitors.length ? monitors : [];
    // setSelectedOptions(Object.assign({}, newSelected));

    // _.set(values, 'associatedMonitors', Object.values(newSelected));
  }, [monitors, options, values]);

  const onChange = (options, monitorIdx, form) => {
    let newSelected = {
      ...selectedOptions,
    };
    if (options[0]) {
      newSelected[monitorIdx] = options[0];
    } else {
      delete newSelected[monitorIdx];
    }
    setSelectedOptions(newSelected);

    updateMonitorOptions(newSelected);

    onBlur(monitorIdx, form);
  };

  const updateMonitorOptions = (selected) => {
    const newMonitorOptions = [...monitorOptions];
    newMonitorOptions.forEach((mon) => {
      mon.disabled = isSelected(selected, mon);
    });
    setMonitorOptions([...newMonitorOptions]);
  };

  const onBlur = (monitorIdx, form) => {
    form.setFieldTouched('associatedMonitors', true);
    form.setFieldTouched(`associatedMonitor_${monitorIdx}`, true);
    form.setFieldValue('associatedMonitors', Object.values(selectedOptions));
    form.setFieldError('associatedMonitors', validate());
  };

  const isSelected = (selected, monitor) => {
    let isSelected = false;
    for (const key in selected) {
      if (selected.hasOwnProperty(key)) {
        if (_.isEqual(selected[key], monitor)) {
          isSelected = true;
          break;
        }
      }
    }
    return isSelected;
  };

  const onAddMonitor = () => {
    let nextIndex = Math.max(...monitorFields) + 1;
    const newMonitorFields = [...monitorFields, nextIndex];
    setMonitorFields(newMonitorFields);
  };

  const onRemoveMonitor = (monitorIdx, idx, form) => {
    const newSelected = { ...selectedOptions };
    delete newSelected[monitorIdx];
    setSelectedOptions(newSelected);

    const newMonitorFields = [...monitorFields];
    newMonitorFields.splice(idx, 1);
    setMonitorFields(newMonitorFields);

    updateMonitorOptions(newSelected);

    onBlur(monitorIdx, form);
  };

  const isValid = () => Object.keys(selectedOptions).length > 1;
  const validate = () => {
    if (!isValid()) return 'Required.';
  };

  return (
    <FormikInputWrapper
      name={'associatedMonitors'}
      fieldProps={{
        validate: () => validate(),
      }}
      render={({ field, form }) => (
        <FormikFormRow
          name={'associatedMonitors'}
          form={form}
          rowProps={{
            label: 'Monitor',
            isInvalid: () => form.touched['associatedMonitors'] && !isValid(),
            error: () => validate(),
          }}
        >
          <Fragment>
            {monitorFields.map((monitorIdx, idx) => (
              <EuiFlexGroup
                key={`monitors_list_${monitorIdx}`}
                style={{ width: '400px', position: 'relative' }}
              >
                <EuiFlexItem grow={true}>
                  <FormikComboBox
                    name={`associatedMonitor_${monitorIdx}`}
                    inputProps={{
                      isInvalid:
                        form.touched[`associatedMonitor_${monitorIdx}`] &&
                        form.errors['associatedMonitors'] &&
                        !selectedOptions[monitorIdx],
                      placeholder: 'Select a monitor',
                      onChange: (options, field, form) => onChange(options, monitorIdx, form),
                      onBlur: (e, field, form) => onBlur(monitorIdx, form),
                      options: monitorOptions,
                      singleSelection: { asPlainText: true },
                      selectedOptions: selectedOptions[monitorIdx]
                        ? [selectedOptions[monitorIdx]]
                        : undefined,
                      'data-test-subj': `monitors_list_${monitorIdx}`,
                      fullWidth: true,
                    }}
                  />
                </EuiFlexItem>
                {selectedOptions[monitorIdx] && (
                  <EuiFlexItem
                    grow={false}
                    style={{
                      margin: 0,
                      padding: 0,
                      width: '20px',
                      height: '20px',
                      position: 'absolute',
                      right: '-20px',
                      bottom: '24px',
                    }}
                  >
                    <EuiToolTip title={'View monitor'}>
                      <EuiButtonIcon
                        aria-label={'View monitor'}
                        iconType={'inspect'}
                        color="text"
                        target={'_blank'}
                        href={`alerting#/monitors/${selectedOptions[monitorIdx].value}?alertState=ALL&from=0&monitorIds=${selectedOptions[monitorIdx].value}&search=&severityLevel=ALL&size=20&sortDirection=desc&sortField=start_time`}
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                )}
                {monitorFields.length > 2 && (
                  <EuiFlexItem
                    grow={false}
                    style={{
                      margin: 0,
                      padding: 0,
                      width: '20px',
                      height: '20px',
                      position: 'absolute',
                      right: '-50px',
                      bottom: '24px',
                    }}
                  >
                    <EuiToolTip title={'Remove monitor'}>
                      <EuiButtonIcon
                        aria-label={'Delete selection'}
                        iconType={'trash'}
                        color="danger"
                        onClick={() => onRemoveMonitor(monitorIdx, idx, form)}
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            ))}
            <EuiSpacer size={'m'} />
            <EuiButton
              onClick={() => onAddMonitor()}
              disabled={
                monitorFields.length >= 10 ||
                monitorOptions.length <= Object.keys(selectedOptions).length
              }
            >
              Associate another monitor
            </EuiButton>
            <EuiText color={'subdued'} size={'xs'}>
              You can associate up to {10 - monitorFields.length} more monitors.
            </EuiText>
          </Fragment>
        </FormikFormRow>
      )}
    />
  );
};

export default MonitorsList;
