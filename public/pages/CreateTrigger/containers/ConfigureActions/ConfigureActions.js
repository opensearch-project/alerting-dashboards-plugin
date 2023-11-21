/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { EuiPanel, EuiText, EuiSpacer } from '@elastic/eui';
import Action from '../../components/Action';
import ActionEmptyPrompt from '../../components/ActionEmptyPrompt';
import AddActionButton from '../../components/AddActionButton';
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
import { getInitialActionValues } from '../../components/AddActionButton/utils';

const createActionContext = (context, action) => {
  let trigger = context.trigger;
  const triggerType = Object.keys(trigger)[0];
  if (
    Object.keys(trigger).length === 1 &&
    !_.isEmpty(triggerType) &&
    Object.values(TRIGGER_TYPE).includes(triggerType)
  ) {
    // If the trigger values is wrapped in the trigger type, unwrap it
    trigger = trigger[triggerType];
  } else {
    console.warn(`Unknown trigger type "${triggerType}".`, context);
  }
  return {
    ctx: {
      ...context,
      trigger: { ...trigger },
      action,
    },
  };
};

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
    const { values, fieldPath } = props;
    const firstActionId = _.get(values, `${fieldPath}actions[0].id`, '');
    const startActionIndex = 0;
    const accordionsOpen = firstActionId ? { [startActionIndex]: true } : {};

    this.state = {
      destinations: [],
      flattenedDestinations: [],
      allowList: [],
      loadingDestinations: true,
      actionDeleted: false,
      hasNotificationPlugin: false,
      currentSubmitCount: 0,
      accordionsOpen,
      isInitialLoading: true,
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

  onAccordionToggle = (key) => {
    const accordionsOpen = { ...this.state.accordionsOpen };
    accordionsOpen[key] = !accordionsOpen[key];
    this.setState({ accordionsOpen, currentSubmitCount: this.props.submitCount });
  };

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
      const config_types = await this.props.notificationService.getServerFeatures();
      const getChannelsQuery = {
        from_index: index,
        max_items: MAX_CHANNELS_RESULT_SIZE,
        config_type: config_types,
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
    const { httpClient, values, arrayHelpers, notifications, fieldPath, flyoutMode } = this.props;
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
      const channelOptionsByType = getChannelOptions(destinationsAndChannels);
      this.setState({
        destinations: channelOptionsByType,
        flattenedDestinations: destinationsAndChannels,
        loadingDestinations: false,
      });

      const monitorType = _.get(arrayHelpers, 'form.values.monitor_type', MONITOR_TYPE.QUERY_LEVEL);
      const actions = _.get(values, `${fieldPath}actions`, []);
      const initialActionValues = getInitialActionValues({ monitorType, flyoutMode, actions });

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

    this.setState({ isInitialLoading: false });
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
    const {
      context,
      setFlyout,
      values,
      fieldPath,
      httpClient,
      plugins,
      flyoutMode,
      submitCount,
      errors,
    } = this.props;
    const {
      destinations,
      flattenedDestinations,
      accordionsOpen,
      isInitialLoading,
      currentSubmitCount,
    } = this.state;
    const hasDestinations = !_.isEmpty(destinations);
    const hasActions = !_.isEmpty(_.get(values, `${fieldPath}actions`));
    const shouldRenderActions = hasActions || (hasDestinations && hasActions);
    const hasNotificationPlugin = plugins.indexOf(OS_NOTIFICATION_PLUGIN) !== -1;
    const numActions = _.get(values, `${fieldPath}actions`, []).length;

    return shouldRenderActions ? (
      _.get(values, `${fieldPath}actions`).map((action, index) => {
        const key = action.id;
        if (flyoutMode && submitCount > currentSubmitCount) {
          accordionsOpen[index] =
            accordionsOpen?.[index] || 'actions' in errors.triggerDefinitions[index];
        }

        return (
          <Action
            key={key}
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
            flyoutMode={flyoutMode}
            accordionProps={{
              isOpen: accordionsOpen[index],
              onToggle: () => this.onAccordionToggle(index),
            }}
            isInitialLoading={isInitialLoading}
          />
        );
      })
    ) : (
      <ActionEmptyPrompt
        arrayHelpers={arrayHelpers}
        hasDestinations={hasDestinations}
        httpClient={httpClient}
        hasNotificationPlugin={hasNotificationPlugin}
        flyoutMode={flyoutMode}
        onPostAdd={(initialValues) => this.onAccordionToggle(initialValues.id)}
        numActions={numActions}
      />
    );
  };

  render() {
    const { loadingDestinations } = this.state;
    const { arrayHelpers, values, fieldPath, flyoutMode } = this.props;
    const numActions = _.get(values, `${fieldPath}actions`, []).length;
    const displayAddActionButton = numActions > 0;
    //TODO:: Handle loading Destinations inside the Action which will be more intuitive for customers.
    return (
      <div style={flyoutMode ? {} : { paddingLeft: '10px', paddingRight: '10px' }}>
        {!flyoutMode && (
          <>
            <EuiText>
              <h4>{`Actions (${numActions})`}</h4>
            </EuiText>
            <EuiText color={'subdued'} size={'xs'} style={{ paddingBottom: '5px' }}>
              Define actions when trigger conditions are met.
            </EuiText>
          </>
        )}
        <EuiPanel
          style={flyoutMode ? {} : { padding: '20px' }}
          paddingSize="none"
          hasShadow={!flyoutMode}
          hasBorder={!flyoutMode}
        >
          {!flyoutMode && loadingDestinations && numActions < 1 ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>Loading Destinations...</div>
          ) : (
            <>
              {this.renderActions(arrayHelpers)}
              {flyoutMode && <EuiSpacer size="m" />}
            </>
          )}
          {displayAddActionButton && (
            <div style={flyoutMode ? {} : { paddingBottom: '5px', paddingTop: '20px' }}>
              <AddActionButton
                arrayHelpers={arrayHelpers}
                values={values}
                fieldPath={fieldPath}
                numActions={numActions}
                flyoutMode={flyoutMode}
                onPostAdd={(initialValues) => this.onAccordionToggle(initialValues.id)}
              />
            </div>
          )}
        </EuiPanel>
      </div>
    );
  }
}

export default ConfigureActions;
