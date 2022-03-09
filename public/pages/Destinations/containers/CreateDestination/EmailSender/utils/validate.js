/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';

export const validateEmailSender = (senders) => (value) => {
  if (_.isEmpty(value)) return 'Required';
  // In case existing sender (email account) doesn't exist in list, invalidate the field
  const senderMatches = senders.filter((sender) => sender.value === value[0].value);
  if (senderMatches.length === 0) {
    return 'Matching sender required';
  }
};
