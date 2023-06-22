/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment, useState, useEffect } from 'react';
import {
  EuiSpacer,
  EuiButton,
  EuiText,
  EuiAccordion,
  EuiHorizontalRule,
  EuiButtonIcon,
} from '@elastic/eui';
import TriggerNotificationsContent from './TriggerNotificationsContent';
import { titleTemplate } from './DefineCompositeLevelTrigger';
import { MAX_CHANNELS_RESULT_SIZE, OS_NOTIFICATION_PLUGIN } from '../../../../utils/constants';
import { CHANNEL_TYPES } from '../../utils/constants';

const TriggerNotifications = ({
  httpClient,
  triggerActions = [],
  plugins,
  notifications,
  notificationService,
  triggerValues,
}) => {
  const [actions, setActions] = useState([]);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let newActions = [...triggerActions];
    if (_.isEmpty(newActions))
      newActions = [
        {
          name: '',
          id: '',
        },
      ];

    setActions(newActions);

    getChannels().then((channels) => setOptions(channels));
  }, [triggerValues, plugins]);

  const getChannels = async () => {
    const hasNotificationPlugin = plugins.indexOf(OS_NOTIFICATION_PLUGIN) !== -1;

    let channels = [];
    let index = 0;
    const getChannels = async () => {
      const getChannelsQuery = {
        from_index: index,
        max_items: MAX_CHANNELS_RESULT_SIZE,
        config_type: CHANNEL_TYPES,
        sort_field: 'name',
        sort_order: 'asc',
      };

      const channelsResponse = await notificationService.getChannels(getChannelsQuery);

      channels = channels.concat(
        channelsResponse.items.map((channel) => ({
          label: channel.name,
          value: channel.config_id,
          type: channel.config_type,
          description: channel.description,
        }))
      );

      if (channelsResponse.total && channels.length < channelsResponse.total) {
        index += MAX_CHANNELS_RESULT_SIZE;
        await getChannels();
      }
    };

    if (hasNotificationPlugin) {
      await getChannels();
    }

    return channels;
  };

  const onAddNotification = () => {
    const newActions = [...actions];
    newActions.push({
      label: '',
      value: '',
    });
    setActions(newActions);
  };

  const onRemoveNotification = (idx) => {
    const newActions = [...actions];
    newActions.splice(idx, 1);
    _.set(triggerValues, 'triggerDefinitions[0].actions', newActions);
    setActions(newActions);
  };

  return (
    <Fragment>
      {titleTemplate('Notifications')}
      <EuiSpacer size={'m'} />
      {actions.length &&
        actions.map((action, actionIndex) => (
          <EuiAccordion
            title={`Notification ${actionIndex + 1}`}
            key={`notification-accordion-${actionIndex}`}
            id={`notification-accordion-${actionIndex}`}
            initialIsOpen={!actionIndex}
            buttonContent={<EuiText>{`Notification ${actionIndex + 1}`}</EuiText>}
            paddingSize={'s'}
            extraAction={
              actions.length > 1 && (
                <EuiButtonIcon
                  color={'danger'}
                  aria-label={'Delete notification'}
                  iconType={'trash'}
                  onClick={() => onRemoveNotification(actionIndex)}
                  size={'s'}
                />
              )
            }
          >
            <TriggerNotificationsContent
              action={action}
              options={options}
              actionIndex={actionIndex}
              notifications={notifications}
              triggerValues={triggerValues}
              httpClient={httpClient}
              hasNotifications={plugins.indexOf(OS_NOTIFICATION_PLUGIN) !== -1}
            />
          </EuiAccordion>
        ))}
      <EuiHorizontalRule margin={'s'} />
      <EuiButton onClick={() => onAddNotification()}>Add notification</EuiButton>
    </Fragment>
  );
};

export default TriggerNotifications;
