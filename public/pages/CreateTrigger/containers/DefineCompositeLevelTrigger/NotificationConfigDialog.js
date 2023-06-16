/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiButton,
  EuiSpacer,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import { titleTemplate } from './DefineCompositeLevelTrigger';
import Message from '../../components/Action/actions';
import { FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { getTriggerContext } from '../../utils/helper';
import { formikToMonitor } from '../../../CreateMonitor/containers/CreateMonitor/utils/formikToMonitor';
import _ from 'lodash';
import { formikToTrigger } from '../CreateTrigger/utils/formikToTrigger';
import { backendErrorNotification } from '../../../../utils/helpers';
import { checkForError } from '../ConfigureActions/ConfigureActions';

const NotificationConfigDialog = ({
  channel,
  closeModal,
  triggerValues,
  httpClient,
  notifications,
  actionIndex,
}) => {
  const triggerIndex = 0;
  const monitor = formikToMonitor(triggerValues);
  delete monitor.monitor_type;
  const context = getTriggerContext({}, monitor, triggerValues, 0);

  const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);
  let action = _.get(triggerValues, `triggerDefinitions[0].actions[${actionIndex}]`, {
    ...initialActionValues,
  });

  console.log('Initial actions', action);
  const sendTestMessage = async (index) => {
    let testTrigger = _.cloneDeep(
      formikToTrigger(triggerValues, monitor.ui_metadata)[triggerIndex]
    );

    const action = _.get(testTrigger, `chained_alert_trigger.actions[${index}]`);
    const condition = {
      ..._.get(testTrigger, 'chained_alert_trigger.condition'),
      script: { lang: 'painless', source: 'return true' },
    };
    _.set(testTrigger, 'actions', [action]);
    _.set(testTrigger, 'condition', condition);

    const testMonitor = { ...monitor, triggers: [{ ...testTrigger }] };

    try {
      const response = await httpClient.post('../api/alerting/monitors/_execute', {
        query: { dryrun: false },
        body: JSON.stringify(testMonitor),
      });
      let error = null;
      if (response.ok) {
        error = checkForError(response, error);
        if (!_.isEmpty(action.destination_id))
          notifications.toasts.addSuccess(`Test message sent to "${action.name}."`);
      }
      if (error || !response.ok) {
        const errorMessage = error == null ? response.resp : error;
        console.error('There was an error trying to send test message', errorMessage);
        backendErrorNotification(notifications, 'send', 'test message', errorMessage);
      }
    } catch (err) {
      console.error('There was an error trying to send test message', err);
    }
  };

  console.log('ACTION', action);
  return (
    <EuiModal onClose={() => closeModal()}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Configure notification</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        {titleTemplate('Customize message')}

        <EuiSpacer size={'m'} />

        <Message
          fieldPath={'triggerDefinitions[0]'}
          index={actionIndex}
          values={triggerValues}
          action={action}
          context={{
            ctx: context,
          }}
          sendTestMessage={sendTestMessage}
        />
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButton onClick={() => closeModal()}>Close</EuiButton>
        <EuiButton onClick={() => closeModal()} fill>
          Update
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};

export default NotificationConfigDialog;
