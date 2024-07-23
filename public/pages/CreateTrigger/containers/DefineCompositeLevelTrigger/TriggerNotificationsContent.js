/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState, useEffect } from 'react';
import { EuiPanel, EuiFlexGroup, EuiFlexItem, EuiSmallButtonEmpty, EuiSpacer } from '@elastic/eui';
import { FormikComboBox } from '../../../../components/FormControls';
import NotificationConfigDialog from './NotificationConfigDialog';
import _ from 'lodash';
import { FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { NOTIFY_OPTIONS_VALUES } from '../../components/Action/actions/Message';
import { required } from '../../../../utils/validate';
import { getManageChannelsUrl } from '../../../../utils/helpers';

const TriggerNotificationsContent = ({
  action,
  options,
  actionIndex,
  triggerIndex,
  triggerValues,
  httpClient,
  notifications,
  hasNotifications,
  formikFieldPath,
}) => {
  const [selected, setSelected] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    action?.destination_id &&
      setSelected([
        {
          label: action.name,
          value: action.destination_id,
          type: action.config_type,
          description: action.description,
        },
      ]);
  }, [action]);

  const onChange = (selectedOptions) => {
    setSelected(selectedOptions);

    const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);
    _.set(triggerValues, `${formikFieldPath}actions[${actionIndex}]`, {
      ...initialActionValues,
      destination_id: selectedOptions[0]?.value,
      name: selectedOptions[0]?.label,
      subject_template: {
        lang: 'mustache',
        source: 'Monitor {{ctx.monitor.name}} triggered an alert {{ctx.trigger.name}}',
      },
      action_execution_policy: {
        action_execution_scope: NOTIFY_OPTIONS_VALUES.PER_ALERT,
      },
    });
  };

  const onBlur = (e, field, form) => {
    form.setFieldTouched(field.name, true);
    form.setFieldError(field.name, required(form.values[field.name]));
  };

  const showConfig = () => setIsModalVisible(true);

  return (
    <Fragment>
      <EuiPanel hasBorder={false} hasShadow={false}>
        <EuiFlexGroup>
          <EuiFlexItem
            grow={true}
            style={{
              maxWidth: '400px',
            }}
          >
            <FormikComboBox
              name={`channel_name_${triggerIndex}_${actionIndex}`}
              formRow
              fieldProps={{}}
              rowProps={{
                label: 'Notification channel',
                isInvalid: (name, form) => form.touched[name] && !selected?.length,
                error: (name, form) => form.touched[name] && !selected?.length && 'Required.',
              }}
              inputProps={{
                placeholder: 'Select a channel to get notified',
                options: options,
                selectedOptions: selected,
                onChange: (selectedOptions) => onChange(selectedOptions),
                onBlur: (e, field, form) => onBlur(e, field, form),
                singleSelection: { asPlainText: true },
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ paddingLeft: 0, marginLeft: 0 }}>
            <EuiSmallButtonEmpty
              iconType={'popout'}
              style={{ marginTop: '22px' }}
              disabled={!hasNotifications}
              onClick={() => window.open(getManageChannelsUrl())}
            >
              Manage channels
            </EuiSmallButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        {selected.length ? (
          <Fragment>
            <EuiSpacer size={'xs'} />
            <EuiSmallButtonEmpty iconType={'pencil'} onClick={() => showConfig()}>
              Configure notification
            </EuiSmallButtonEmpty>
          </Fragment>
        ) : null}
      </EuiPanel>
      {isModalVisible && (
        <NotificationConfigDialog
          closeModal={() => setIsModalVisible(false)}
          triggerValues={triggerValues}
          httpClient={httpClient}
          notifications={notifications}
          actionIndex={actionIndex}
          triggerIndex={triggerIndex}
          formikFieldPath={formikFieldPath}
        />
      )}
    </Fragment>
  );
};

export default TriggerNotificationsContent;
