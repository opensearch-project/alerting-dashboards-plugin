/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { ALLOW_LIST_SETTING_PATH } from './constants';
import { backendErrorNotification } from '../../../utils/helpers';

export async function getAllowList(httpClient) {
  try {
    const response = await httpClient.get('../api/alerting/_settings');
    if (response.ok) {
      // Attempt to resolve the value of allow_list in the order of 'persistent, 'transient' and 'defaults' settings
      const { defaults, transient, persistent } = response.resp;
      const defaultList = _.get(defaults, `${ALLOW_LIST_SETTING_PATH}`, []);
      const transientList = _.get(transient, `${ALLOW_LIST_SETTING_PATH}`, null);
      const persistentList = _.get(persistent, `${ALLOW_LIST_SETTING_PATH}`, null);

      return persistentList || transientList || defaultList;
    } else {
      console.log('Unable to get destination allow_list', response.resp);
      return [];
    }
  } catch (err) {
    console.log('Unable to get destination allow_list', err);
    return [];
  }
}
