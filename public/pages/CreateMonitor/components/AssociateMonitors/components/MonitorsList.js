/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState, useEffect, useCallback } from 'react';
import * as _ from 'lodash';
import {
  EuiSmallButton,
  EuiSmallButtonIcon,
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
import { DEFAULT_ASSOCIATED_MONITORS_VALUE } from '../../../containers/CreateMonitor/utils/constants';
import { getMonitors } from '../AssociateMonitors';
import { required } from '../../../../../utils/validate';
import { getItemLevelType } from '../../../../Monitors/containers/Monitors/utils/helpers';

const MonitorsList = ({ values, httpClient }) => {
  const formikFieldName = 'associatedMonitorsList';
  const formikValueName = 'associatedMonitors';

  const [fields, setFields] = useState([0, 1]);
  const [options, setOptions] = useState([]);
  const [selection, setSelection] = useState({});

  useEffect(() => {
    const monitorOptions = _.get(values, 'monitorOptions', []);
    if (monitorOptions.length) {
      setOptions(monitorsToOptions(monitorOptions));
      const selected = formikToSelection(monitorOptions);
      setFields(generateFields(selected));
    } else {
      getMonitors(httpClient).then((monitors) => {
        _.set(values, 'monitorOptions', monitors);

        setOptions(monitorsToOptions(monitors));
        const selected = formikToSelection(monitors);
        setFields(generateFields(selected));
      });
    }
  }, [values]);

  const formikToSelection = (options) => {
    const associatedMonitors = _.get(
      values,
      'associatedMonitors',
      DEFAULT_ASSOCIATED_MONITORS_VALUE
    );

    const selected = {};
    const delegates = _.sortBy(associatedMonitors.sequence.delegates, ['order']);
    delegates.forEach((monitor, index) => {
      const filteredOption = options.filter((option) => option.monitor_id === monitor.monitor_id);
      selected[index] = {
        label: filteredOption[0]?.monitor_name || '',
        value: monitor.monitor_id,
      };
    });

    setSelection(selected);
    return selected;
  };

  const generateFields = (selected) => {
    return _.reduce(
      Object.keys(selected).length > 1 ? Object.keys(selected) : [0, 1],
      (result, value, key) => {
        result.push(key);
        return result;
      },
      []
    );
  };

  const monitorsToOptions = (monitors) =>
    monitors.map(({ monitor_name, monitor_id, monitor_type }) => ({
      label: monitor_name,
      value: monitor_id,
      monitor_type,
    }));

  const onChange = (options, monitorIdx, form) => {
    let selected = {
      ...selection,
    };
    if (options[0]) {
      selected[monitorIdx] = options[0];
    } else {
      delete selected[monitorIdx];
    }
    setSelection(selected);

    setFormikValues(selected, monitorIdx, form);
    updateSelection(selected);
  };

  const onBlur = (e, field, form) => {
    form.setFieldTouched(formikFieldName, true);
    form.setFieldTouched(field.name, true);
  };

  const updateSelection = (selected) => {
    const newMonitorOptions = [...options];
    newMonitorOptions.forEach((mon) => {
      mon.disabled = isSelected(selected, mon);
    });

    setOptions([...newMonitorOptions]);
  };

  const setFormikValues = (selected, monitorIdx, form) => {
    const associatedMonitors = _.get(
      values,
      'associatedMonitors',
      DEFAULT_ASSOCIATED_MONITORS_VALUE
    );
    associatedMonitors.sequence.delegates = selectionToFormik(selected);
    form.setFieldValue(formikValueName, associatedMonitors);
  };

  const selectionToFormik = (selection) => {
    const monitors = [];
    Object.values(selection).forEach((monitor, index) => {
      monitors.push({
        order: index + 1,
        monitor_id: monitor.value,
      });
    });

    return monitors;
  };

  const isSelected = (selected, monitor) => {
    let isSelected = false;
    for (const key in selected) {
      if (selected.hasOwnProperty(key)) {
        if (selected[key].value === monitor.value) {
          isSelected = true;
          break;
        }
      }
    }
    return isSelected;
  };

  const onAddMonitor = () => {
    let nextIndex = Math.max(...fields) + 1;
    const newMonitorFields = [...fields, nextIndex];
    setFields(newMonitorFields);

    updateSelection(selection);
  };

  const onRemoveMonitor = (monitorIdx, idx, form) => {
    const selected = { ...selection };
    delete selected[monitorIdx];
    setSelection(selected);

    const newMonitorFields = [...fields];
    newMonitorFields.splice(idx, 1);
    setFields(newMonitorFields);

    setFormikValues(selected, monitorIdx, form);
    updateSelection(selected);
  };

  const isValid = () => Object.keys(selection).length > 1;

  const getGroupedOptions = useCallback(() => {
    const monitorsByType = {};
    options.forEach((option) => {
      const { monitor_type } = option;
      monitorsByType[monitor_type] = monitorsByType[monitor_type] || [];
      monitorsByType[monitor_type].push(option);
    });

    return Object.entries(monitorsByType).map(([monitorType, monitors]) => {
      return {
        label: `${getItemLevelType(monitorType)} monitor(s)`,
        options: monitors,
      };
    });
  }, [options]);

  return (
    <FormikInputWrapper
      name={formikFieldName}
      fieldProps={{
        validate: required,
      }}
      render={({ form }) => (
        <FormikFormRow
          name={formikFieldName}
          form={form}
          rowProps={{
            label: 'Monitor',
            isInvalid: () => form.touched[formikFieldName] && !isValid(),
            error: () => required(),
          }}
        >
          <Fragment>
            {fields.map((monitorIdx, idx) => (
              <EuiFlexGroup
                key={`monitors_list_${monitorIdx}`}
                style={{ width: '400px', position: 'relative' }}
              >
                <EuiFlexItem grow={true}>
                  <FormikComboBox
                    name={`${formikFieldName}_${monitorIdx}`}
                    inputProps={{
                      isInvalid:
                        (form.touched[`${formikFieldName}_${monitorIdx}`] ||
                          form.touched[formikFieldName]) &&
                        !selection[monitorIdx],
                      placeholder: 'Select a monitor',
                      onChange: (options, field, form) => onChange(options, monitorIdx, form),
                      onBlur: (e, field, form) => onBlur(e, field, form),
                      options: getGroupedOptions(),
                      singleSelection: { asPlainText: true },
                      selectedOptions: selection[monitorIdx] ? [selection[monitorIdx]] : undefined,
                      'data-test-subj': `monitors_list_${monitorIdx}`,
                      fullWidth: true,
                    }}
                  />
                </EuiFlexItem>
                {selection[monitorIdx] && (
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
                    <EuiToolTip content={'View monitor'}>
                      <EuiSmallButtonIcon
                        aria-label={'View monitor'}
                        iconType={'inspect'}
                        color="text"
                        target={'_blank'}
                        href={`alerting#/monitors/${selection[monitorIdx].value}?alertState=ALL&from=0&monitorIds=${selection[monitorIdx].value}&search=&severityLevel=ALL&size=20&sortDirection=desc&sortField=start_time`}
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                )}
                {fields.length > 2 && (
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
                    <EuiToolTip content={'Remove monitor'}>
                      <EuiSmallButtonIcon
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
            <EuiSmallButton
              onClick={() => onAddMonitor()}
              disabled={fields.length >= 10 || fields.length >= options.length}
            >
              Add another monitor
            </EuiSmallButton>
            <EuiText color={'subdued'} size={'xs'}>
              You can add up to {10 - fields.length} more monitors.
            </EuiText>
          </Fragment>
        </FormikFormRow>
      )}
    />
  );
};

export default MonitorsList;
