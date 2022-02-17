/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MAX_QUERY_RESULT_SIZE } from '../../../../../../utils/constants';

export default async function getSenders(httpClient, searchText = '') {
  try {
    const response = await httpClient.get('../api/alerting/destinations/email_accounts', {
      query: { search: searchText, size: MAX_QUERY_RESULT_SIZE },
    });
    if (response.ok) {
      return response.emailAccounts;
    } else {
      console.log('Unable to get email accounts', response.err);
      // TODO: 'response.ok' is 'false' when there is no alerting config index in the cluster, and notification should not be shown to new Alerting users
      // backendErrorNotification(notifications, 'get', 'email accounts', response.err);
      return [];
    }
  } catch (err) {
    console.log('Unable to get email accounts', err);
    return [];
  }
}
