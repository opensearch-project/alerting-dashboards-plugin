/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React from 'react';
import _ from 'lodash';
import Action from '../../components/Action';
import ActionEmptyPrompt from '../../components/ActionEmptyPrompt';
import AddActionButton from '../../components/AddActionButton';
import ContentPanel from '../../../../components/ContentPanel';
import { CHANNEL_TYPES, FORMIK_INITIAL_ACTION_VALUES } from '../../utils/constants';
import { getAllowList } from '../../../Destinations/utils/helpers';
import { MAX_QUERY_RESULT_SIZE } from '../../../../utils/constants';
import { backendErrorNotification } from '../../../../utils/helpers';
import { getChannelOptions } from '../../utils/helper';

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
      flattenDestinations: [],
      allowList: [],
      loadingDestinations: true,
    };
  }

  async componentDidMount() {
    const { httpClient } = this.props;

    const allowList = await getAllowList(httpClient);
    this.setState({ allowList });

    this.loadDestinations();
  }

  loadDestinations = async (searchText = '') => {
    const { httpClient, values, arrayHelpers, notifications } = this.props;
    const { allowList, actionDeleted } = this.state;
    this.setState({ loadingDestinations: true });
    try {
      const response = await httpClient.get('../api/alerting/destinations', {
        query: { search: searchText, size: MAX_QUERY_RESULT_SIZE },
      });
      if (response.ok) {
        // Fetch description for channels
        const tempQueryObj = {
          from_index: 0,
          max_items: MAX_QUERY_RESULT_SIZE,
          query: searchText,
          config_type: CHANNEL_TYPES,
          sort_field: 'name',
          sort_order: 'asc',
        };
        const channelsResponse = await this.props.notificationService.getChannels(tempQueryObj);
        const channels = channelsResponse.items;
        const getDestinationDescription = (destination) => {
          const foundDestination = channels.find(({ config_id }) => config_id === destination.id);
          if (foundDestination) return foundDestination.description;
          return '';
        };
        const destinations = response.destinations
          .map((destination) => ({
            label: destination.name,
            value: destination.id,
            type: destination.type,
            description: getDestinationDescription(destination),
          }))
          .filter(({ type }) => allowList.includes(type));

        const channelOptionsByType = getChannelOptions(destinations, CHANNEL_TYPES);
        this.setState({
          destinations: channelOptionsByType,
          flattenDestinations: destinations,
          loadingDestinations: false,
        });

        // If actions is not defined  If user choose to delete actions, it will not override customer's preferences.
        if (destinations.length > 0 && !values.actions && !actionDeleted) {
          arrayHelpers.insert(0, FORMIK_INITIAL_ACTION_VALUES);
        }
      } else {
        backendErrorNotification(notifications, 'load', 'destinations', response.err);
      }
    } catch (err) {
      console.error(err);
      this.setState({ destinations: [], loadingDestinations: false });
    }
  };

  sendTestMessage = async (index) => {
    const {
      context: { monitor, trigger },
      httpClient,
      notifications,
    } = this.props;
    const action = trigger.actions[index];
    const condition = { script: { lang: 'painless', source: 'return true' } };
    const testMonitor = { ...monitor, triggers: [{ ...trigger, actions: [action], condition }] };
    try {
      const response = await httpClient.post('../api/alerting/monitors/_execute', {
        query: { dryrun: false },
        body: JSON.stringify(testMonitor),
      });
      let error = null;
      if (response.ok) {
        error = checkForError(response, error);
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
    const { context, setFlyout, values, httpClient } = this.props;
    const { destinations, flattenDestinations } = this.state;
    const hasDestinations = !_.isEmpty(destinations);
    const hasActions = !_.isEmpty(values.actions);
    const shouldRenderActions = hasActions || (hasDestinations && hasActions);
    return shouldRenderActions ? (
      values.actions.map((action, index) => (
        <Action
          key={index}
          action={action}
          arrayHelpers={arrayHelpers}
          context={createActionContext(context, action)}
          destinations={destinations}
          flattenDestinations={flattenDestinations}
          index={index}
          onDelete={() => {
            this.setState({ actionDeleted: true });
            arrayHelpers.remove(index);
          }}
          sendTestMessage={this.sendTestMessage}
          setFlyout={setFlyout}
          httpClient={httpClient}
        />
      ))
    ) : (
      <ActionEmptyPrompt arrayHelpers={arrayHelpers} hasDestinations={hasDestinations} />
    );
  };

  render() {
    const { loadingDestinations } = this.state;
    const { arrayHelpers } = this.props;
    //TODO:: Handle loading Destinations inside the Action which will be more intuitive for customers.
    return (
      <ContentPanel
        title="Configure actions"
        titleSize="s"
        panelStyles={{ paddingBottom: '0px' }}
        bodyStyles={{ padding: '10px' }}
        horizontalRuleClassName="accordion-horizontal-rule"
        actions={<AddActionButton arrayHelpers={arrayHelpers} />}
      >
        {loadingDestinations ? (
          <div style={{ display: 'flex', justifyContent: 'center' }}>Loading Destinations...</div>
        ) : (
          this.renderActions(arrayHelpers)
        )}
      </ContentPanel>
    );
  }
}

export default ConfigureActions;
