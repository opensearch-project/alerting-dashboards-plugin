/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiSmallButton,
  EuiSpacer,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
} from '@elastic/eui';
import Message from '../../components/Action/actions';
import { FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { getTriggerContext } from '../../utils/helper';
import { formikToMonitor } from '../../../CreateMonitor/containers/CreateMonitor/utils/formikToMonitor';
import _ from 'lodash';
import { formikToTrigger } from '../CreateTrigger/utils/formikToTrigger';
import { backendErrorNotification, titleTemplate } from '../../../../utils/helpers';
import { checkForError } from '../ConfigureActions/ConfigureActions';
import { TRIGGER_TYPE } from '../CreateTrigger/utils/constants';
import { getDataSourceId } from '../../../utils/helpers';

const NotificationConfigDialog = ({
  closeModal,
  triggerValues,
  httpClient,
  notifications,
  actionIndex,
  triggerIndex,
  formikFieldPath,
}) => {
  const monitor = formikToMonitor(triggerValues);
  delete monitor.monitor_type;
  const context = getTriggerContext({}, monitor, triggerValues, 0);

  const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);
  let action = _.get(triggerValues, `${formikFieldPath}actions[${actionIndex}]`, {
    ...initialActionValues,
  });

  const [initialValues, setInitialValues] = useState({});

  useEffect(() => {
    setInitialValues({
      [`action${actionIndex}`]: _.get(
        triggerValues,
        `${formikFieldPath}actions.${actionIndex}`,
        ''
      ),
    });
  }, []);

  const sendTestMessage = async (index) => {
    const monitorData = _.cloneDeep(monitor);
    let testTrigger = _.cloneDeep(
      formikToTrigger(triggerValues, monitorData.ui_metadata)[triggerIndex]
    );

    testTrigger = {
      ...testTrigger,
      name: _.get(triggerValues, `${formikFieldPath}name`, ''),
      severity: _.get(triggerValues, `${formikFieldPath}severity`, ''),
    };
    const action = _.get(testTrigger, `${TRIGGER_TYPE.COMPOSITE_LEVEL}.actions[${index}]`);
    const condition = {
      ..._.get(testTrigger, `${TRIGGER_TYPE.COMPOSITE_LEVEL}.condition`),
      script: { lang: 'painless', source: 'return true' },
    };

    delete testTrigger[TRIGGER_TYPE.COMPOSITE_LEVEL];

    _.set(testTrigger, 'actions', [action]);
    _.set(testTrigger, 'condition', condition);

    const testMonitor = { ...monitor, triggers: [{ ...testTrigger }] };

    try {
      const response = await httpClient.post('../api/alerting/monitors/_execute', {
        query: { dryrun: false, dataSourceId: getDataSourceId() },
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

  const clearConfig = () => {
    _.set(
      triggerValues,
      `${formikFieldPath}actions.${actionIndex}`,
      initialValues[`action${actionIndex}`]
    );
    closeModal();
  };

  return (
    <EuiModal onClose={() => clearConfig()}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <h1>Configure notification</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        {titleTemplate('Customize message')}

        <EuiSpacer size={'m'} />

        <Message
          fieldPath={formikFieldPath}
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
        <EuiSmallButton onClick={() => clearConfig()}>Cancel</EuiSmallButton>
        <EuiSmallButton onClick={() => closeModal()} fill>
          Update
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};

export default NotificationConfigDialog;
