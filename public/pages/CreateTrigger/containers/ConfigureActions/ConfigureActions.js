/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiPanel, EuiText } from '@elastic/eui';
import Action from '../../components/Action';
import ActionEmptyPrompt from '../../components/ActionEmptyPrompt';
import AddActionButton from '../../components/AddActionButton';
import {
  CHANNEL_TYPES,
  DEFAULT_MESSAGE_SOURCE,
  FORMIK_INITIAL_ACTION_VALUES,
} from '../../utils/constants';
import { getAllowList } from '../../../Destinations/utils/helpers';
import {
  MAX_QUERY_RESULT_SIZE,
  MAX_CHANNELS_RESULT_SIZE,
  MONITOR_TYPE,
  OS_NOTIFICATION_PLUGIN,
} from '../../../../utils/constants';
import { backendErrorNotification } from '../../../../utils/helpers';
import { TRIGGER_TYPE } from '../CreateTrigger/utils/constants';
import { formikToTrigger } from '../CreateTrigger/utils/formikToTrigger';
import { getChannelOptions, toChannelType } from '../../utils/helper';

const createActionContext = (context, action) => ({
  ctx: {
    ...context,
    action,
  },
});

export const checkForError = (response, error) => {
  for (const trigger_name in response.resp.trigger_results) {
    // Check for errors in the trigger response
    if (!response.resp.trigger_results[trigger_name].error) {
      // Check for errors in the actions configured
      for (const action_result in response.resp.trigger_results[trigger_name].action_results) {
        error = response.resp.trigger_results[trigger_name].action_results[action_result].error;
      }
    } else {
      error = response.resp.trigger_results[trigger_name].error;
    }
  }
  return error;
};

class ConfigureActions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      destinations: [],
      flattenedDestinations: [],
      allowList: [],
      loadingDestinations: true,
      actionDeleted: false,
      hasNotificationPlugin: false,
    };
  }

  async componentDidMount() {
    const { httpClient, plugins } = this.props;

    const allowList = await getAllowList(httpClient);
    this.setState({ allowList });

    // Check if notification plugin is present
    if (plugins.indexOf(OS_NOTIFICATION_PLUGIN) !== -1) {
      this.setState({ hasNotificationPlugin: true });
    }

    this.loadDestinations();
  }

  componentDidUpdate(prevProps) {
    if (this.props.plugins !== prevProps.plugins) {
      if (this.props.plugins.indexOf(OS_NOTIFICATION_PLUGIN) !== -1) {
        this.setState({ hasNotificationPlugin: true });
      }

      this.loadDestinations();
    }
  }

  /**
   * Returns all channels in consecutive requests until all channels are returned
   * @returns {Promise<*[]>}
   */
  getChannels = async () => {
    const { plugins } = this.props;
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

      const channelsResponse = await this.props.notificationService.getChannels(getChannelsQuery);

      // TODO: Might still need to filter the allowed channel types here if the backend doesn't
      //   since Notifications uses its own setting
      channels = channels.concat(
        channelsResponse.items.map((channel) => ({
          label: `[Channel] ${channel.name}`,
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

  loadDestinations = async (searchText = '') => {
    const { httpClient, values, arrayHelpers, notifications, fieldPath } = this.props;
    const { allowList, actionDeleted } = this.state;

    this.setState({ loadingDestinations: true });
    try {
      const response = await httpClient.get('../api/alerting/destinations', {
        query: { search: searchText, size: MAX_QUERY_RESULT_SIZE },
      });
      let destinations = [];
      if (response.ok) {
        // Retrieve legacy Destinations in case there are any
        destinations = response.destinations
          .filter((destination) => allowList.includes(destination.type))
          .map((destination) => ({
            label: `[Destination] ${destination.name}`,
            value: destination.id,
            type: toChannelType(destination.type),
            description: '',
          }));
      } else {
        backendErrorNotification(notifications, 'load', 'destinations', response.err);
      }

      let channels = await this.getChannels();

      const destinationsAndChannels = destinations.concat(channels);
      const channelOptionsByType = getChannelOptions(destinationsAndChannels, CHANNEL_TYPES);
      this.setState({
        destinations: channelOptionsByType,
        flattenedDestinations: destinationsAndChannels,
        loadingDestinations: false,
      });

      const monitorType = _.get(arrayHelpers, 'form.values.monitor_type', MONITOR_TYPE.QUERY_LEVEL);
      const initialActionValues = _.cloneDeep(FORMIK_INITIAL_ACTION_VALUES);
      switch (monitorType) {
        case MONITOR_TYPE.BUCKET_LEVEL:
          _.set(
            initialActionValues,
            'message_template.source',
            DEFAULT_MESSAGE_SOURCE.BUCKET_LEVEL_MONITOR
          );
          break;
        default:
          _.set(
            initialActionValues,
            'message_template.source',
            DEFAULT_MESSAGE_SOURCE.QUERY_LEVEL_MONITOR
          );
          break;
      }

      // If actions is not defined  If user choose to delete actions, it will not override customer's preferences.
      if (
        destinationsAndChannels.length > 0 &&
        !_.get(values, `${fieldPath}actions`) &&
        !actionDeleted
      ) {
        arrayHelpers.insert(0, initialActionValues);
      }
    } catch (err) {
      console.error(err);
      this.setState({
        destinations: [],
        flattenedDestinations: [],
        loadingDestinations: false,
      });
    }
  };

  sendTestMessage = async (index) => {
    const {
      context: { monitor },
      httpClient,
      notifications,
      triggerIndex,
      values,
    } = this.props;
    const { flattenedDestinations } = this.state;
    // TODO: For bucket-level triggers, sendTestMessage will only send a test message if there is
    //  at least one bucket of data from the monitor input query.
    let testTrigger = _.cloneDeep(formikToTrigger(values, monitor.ui_metadata)[triggerIndex]);
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

  renderActions = (arrayHelpers) => {
    const { context, setFlyout, values, fieldPath, httpClient, plugins } = this.props;
    const { destinations, flattenedDestinations } = this.state;
    const hasDestinations = !_.isEmpty(destinations);
    const hasActions = !_.isEmpty(_.get(values, `${fieldPath}actions`));
    const shouldRenderActions = hasActions || (hasDestinations && hasActions);
    const hasNotificationPlugin = plugins.indexOf(OS_NOTIFICATION_PLUGIN) !== -1;

    return shouldRenderActions ? (
      _.get(values, `${fieldPath}actions`).map((action, index) => (
        <Action
          key={index}
          action={action}
          arrayHelpers={arrayHelpers}
          context={createActionContext(context, action)}
          destinations={destinations}
          flattenedDestinations={flattenedDestinations}
          index={index}
          onDelete={() => {
            this.setState({ actionDeleted: true });
            arrayHelpers.remove(index);
          }}
          sendTestMessage={this.sendTestMessage}
          setFlyout={setFlyout}
          httpClient={httpClient}
          fieldPath={fieldPath}
          values={values}
          hasNotificationPlugin={hasNotificationPlugin}
          loadDestinations={this.loadDestinations}
        />
      ))
    ) : (
      <ActionEmptyPrompt
        arrayHelpers={arrayHelpers}
        hasDestinations={hasDestinations}
        httpClient={httpClient}
        hasNotificationPlugin={hasNotificationPlugin}
      />
    );
  };

  render() {
    const { loadingDestinations } = this.state;
    const { arrayHelpers, values, fieldPath } = this.props;
    const numOfActions = _.get(values, `${fieldPath}actions`, []).length;
    const displayAddActionButton = numOfActions > 0;
    //TODO:: Handle loading Destinations inside the Action which will be more intuitive for customers.
    return (
      <div style={{ paddingLeft: '10px', paddingRight: '10px' }}>
        <EuiText>
          <h4>{`Actions (${numOfActions})`}</h4>
        </EuiText>
        <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '5px' }}>
          Define actions when trigger conditions are met.
        </EuiText>
        <EuiPanel style={{ backgroundColor: '#F7F7F7', padding: '20px' }}>
          {loadingDestinations && numOfActions < 1 ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>Loading Destinations...</div>
          ) : (
            this.renderActions(arrayHelpers)
          )}

          {displayAddActionButton ? (
            <div style={{ paddingBottom: '5px', paddingTop: '20px' }}>
              <AddActionButton arrayHelpers={arrayHelpers} numOfActions={numOfActions} />
            </div>
          ) : null}
        </EuiPanel>
      </div>
    );
  }
}

export default ConfigureActions;
