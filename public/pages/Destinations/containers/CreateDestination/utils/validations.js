/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { getAllowList } from '../../../utils/helpers';

export const validateDestinationName = (httpClient, destinationToEdit) => async (value) => {
  try {
    if (!value) return 'Required';
    const response = await httpClient.get('../api/alerting/destinations', {
      query: { search: value, sortField: 'destination.name.keyword' },
    });
    if (_.get(response, 'totalDestinations', 0)) {
      if (!destinationToEdit) return 'Destination name is already used';
      if (destinationToEdit && destinationToEdit.name !== value) {
        return 'Destination name is already used';
      }
    }
    // TODO: Handle the situation that destinations with a same name can be created when user don't have the permission of 'cluster:admin/opendistro/alerting/monitor/search'
  } catch (err) {
    if (typeof err === 'string') return err;
    return 'There was a problem validating destination name. Please try again.';
  }
};

export const validateDestinationType = (httpClient) => async (value) => {
  // Check if Destination type is allowed to notify users in the cases
  // where a Destination type has been disallowed during form editing
  const allowList = await getAllowList(httpClient);
  if (allowList.length === 0) {
    return 'To select a type of destination, contact your administrator to obtain the following required permission for at least one of your Security role(s): cluster:monitor/state';
  } else if (!allowList.includes(value)) {
    return `Destination type [${value}] is disallowed`;
  }
};
