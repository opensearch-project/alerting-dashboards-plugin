/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState } from 'react';
import { EuiPanel, EuiFlexGroup, EuiFlexItem, EuiButtonEmpty, EuiSpacer } from '@elastic/eui';
import { FormikComboBox } from '../../../../components/FormControls';
import NotificationConfigDialog from './NotificationConfigDialog';
import _ from 'lodash';
import { FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';

const TriggerNotificationsContent = ({
  channel,
  options,
  idx,
  triggerValues,
  httpClient,
  notifications,
}) => {
  const [selected, setSelected] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const onChange = (selectedOptions) => {
    setSelected(selectedOptions);
    const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);
    _.set(triggerValues, 'triggerDefinitions[0].actions[0]', {
      ...initialActionValues,
      destination_id: selectedOptions[0]?.value,
      subject_template: {
        lang: 'mustache',
        source: 'Monitor {{ctx.monitor.name}} triggered an alert {{ctx.trigger.name}}',
      },
    });

    console.log('CHANNEL SELECTED', _.get(triggerValues, 'triggerDefinitions[0].actions[0]', {}));
  };

  const showConfig = (channels) => setIsModalVisible(true);

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
              name={`channel_name_${idx}`}
              formRow
              fieldProps={{
                isInvalid: !selected.length,
                errors: !selected.length && 'Required.',
              }}
              rowProps={{
                label: 'Notification channel',
              }}
              inputProps={{
                isInvalid: !selected.length,
                value: channel,
                placeholder: 'Select a channel to get notified',
                options: options,
                selectedOptions: selected,
                onChange: (selectedOptions) => onChange(selectedOptions),
                singleSelection: { asPlainText: true },
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ paddingLeft: 0, marginLeft: 0 }}>
            <EuiButtonEmpty iconType={'popout'} style={{ marginTop: '22px' }}>
              Manage channels
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        {selected.length ? (
          <Fragment>
            <EuiSpacer size={'xs'} />
            <EuiButtonEmpty iconType={'pencil'} onClick={() => showConfig()}>
              Configure notification
            </EuiButtonEmpty>
          </Fragment>
        ) : null}
      </EuiPanel>
      {isModalVisible && (
        <NotificationConfigDialog
          closeModal={() => setIsModalVisible(false)}
          channel={channel}
          triggerValues={triggerValues}
          httpClient={httpClient}
          notifications={notifications}
        />
      )}
    </Fragment>
  );
};

export default TriggerNotificationsContent;
