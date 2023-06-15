/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
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
import { DEFAULT_MESSAGE_SOURCE, FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { getTriggerContext } from '../../utils/helper';
import { formikToMonitor } from '../../../CreateMonitor/containers/CreateMonitor/utils/formikToMonitor';
import _ from 'lodash';
import { formikToTrigger } from '../CreateTrigger/utils/formikToTrigger';
import { MONITOR_TYPE } from '../../../../utils/constants';
import { TRIGGER_TYPE } from '../CreateTrigger/utils/constants';
import { backendErrorNotification } from '../../../../utils/helpers';
import { checkForError } from '../ConfigureActions/ConfigureActions';

const NotificationConfigDialog = ({
  channel,
  closeModal,
  triggerValues,
  httpClient,
  notifications,
}) => {
  const triggerIndex = 0;
  const monitor = formikToMonitor(triggerValues);
  const context = getTriggerContext({}, monitor, triggerValues, 0);

  const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);
  let action = _.get(triggerValues, 'triggerDefinitions[0].actions[0]', {
    ...initialActionValues,
  });

  const sendTestMessage = async (index) => {
    const flattenedDestinations = [];
    // TODO: For bucket-level triggers, sendTestMessage will only send a test message if there is
    //  at least one bucket of data from the monitor input query.
    let testTrigger = _.cloneDeep(
      formikToTrigger(triggerValues, monitor.ui_metadata)[triggerIndex]
    );
    let action;
    let condition;

    switch (monitor.monitor_type) {
      case MONITOR_TYPE.BUCKET_LEVEL:
        action = _.get(testTrigger, `${TRIGGER_TYPE.BUCKET_LEVEL}.actions[${index}]`);
        condition = {
          ..._.get(testTrigger, `${TRIGGER_TYPE.BUCKET_LEVEL}.condition`),
          buckets_path: { _count: '_count' },
          script: {
            source: 'params._count >= 0',
          },
        };
        _.set(testTrigger, `${TRIGGER_TYPE.BUCKET_LEVEL}.actions`, [action]);
        _.set(testTrigger, `${TRIGGER_TYPE.BUCKET_LEVEL}.condition`, condition);
        break;
      case MONITOR_TYPE.DOC_LEVEL:
        action = _.get(testTrigger, `${TRIGGER_TYPE.DOC_LEVEL}.actions[${index}]`);
        condition = {
          ..._.get(testTrigger, `${TRIGGER_TYPE.DOC_LEVEL}.condition`),
          script: { lang: 'painless', source: 'return true' },
        };
        _.set(testTrigger, `${TRIGGER_TYPE.DOC_LEVEL}.actions`, [action]);
        _.set(testTrigger, `${TRIGGER_TYPE.DOC_LEVEL}.condition`, condition);
        break;
      default:
        action = _.get(testTrigger, `actions[${index}]`);
        condition = {
          ..._.get(testTrigger, 'condition'),
          script: { lang: 'painless', source: 'return true' },
        };
        _.set(testTrigger, 'actions', [action]);
        _.set(testTrigger, 'condition', condition);
        break;
    }

    const testMonitor = { ...monitor, triggers: [{ ...testTrigger }] };

    try {
      const response = await httpClient.post('../api/alerting/monitors/_execute', {
        query: { dryrun: false },
        body: JSON.stringify(testMonitor),
      });
      let error = null;
      if (response.ok) {
        error = checkForError(response, error);
        if (!_.isEmpty(action.destination_id)) {
          const destinationName = _.get(
            _.find(flattenedDestinations, { value: action.destination_id }),
            'label'
          );
          notifications.toasts.addSuccess(`Test message sent to "${destinationName}."`);
        }
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
          index={0}
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
