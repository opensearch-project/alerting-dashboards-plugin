/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { RECIPIENT_TYPE } from './constants';
import { isValidEmail } from '../../../../components/createDestinations/Email/utils/validate';

export const validateEmailRecipients = (options) => {
  if (_.isEmpty(options)) return 'Required';

  let invalidEmails = [];
  for (const option of options) {
    if (option.type === RECIPIENT_TYPE.EMAIL && !isValidEmail(option.value)) {
      invalidEmails.push(option.value);
    }
  }

  if (invalidEmails.length > 0) return `Invalid emails: ${invalidEmails.join(', ')}`;
};
