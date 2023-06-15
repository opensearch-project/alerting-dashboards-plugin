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
  actions = [],
  plugins,
  notifications,
  notificationService,
  triggerValues,
}) => {
  const [channels, setChannels] = useState([]);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let newChannels = [...actions];
    if (_.isEmpty(newChannels))
      newChannels = [
        {
          name: '',
          id: '',
        },
      ];
    setChannels(newChannels);

    getChannels().then((channels) => setOptions(channels));
  }, []);

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
    const newChannels = [...channels];
    newChannels.push({
      label: '',
      value: '',
    });
    setChannels(newChannels);
  };

  const onRemoveNotification = (idx) => {
    const newChannels = [...channels];
    newChannels.splice(idx, 1);
    setChannels(newChannels);
  };

  return (
    <Fragment>
      {titleTemplate('Notifications')}
      <EuiSpacer size={'m'} />
      {channels.length &&
        channels.map((channel, idx) => (
          <EuiAccordion
            title={`Notification ${idx + 1}`}
            key={`notification-accordion-${idx}`}
            id={`notification-accordion-${idx}`}
            initialIsOpen={!idx}
            buttonContent={<EuiText>{`Notification ${idx + 1}`}</EuiText>}
            paddingSize={'s'}
            extraAction={
              channels.length > 1 && (
                <EuiButtonIcon
                  color={'danger'}
                  aria-label={'Delete notification'}
                  iconType={'trash'}
                  onClick={() => onRemoveNotification(idx)}
                  size={'s'}
                />
              )
            }
          >
            <TriggerNotificationsContent
              channel={channel}
              options={options}
              idx={idx}
              notifications={notifications}
              triggerValues={triggerValues}
              httpClient={httpClient}
              actions={actions}
            />
          </EuiAccordion>
        ))}
      <EuiHorizontalRule margin={'s'} />
      <EuiButton onClick={() => onAddNotification()}>Add notification</EuiButton>
    </Fragment>
  );
};

export default TriggerNotifications;
