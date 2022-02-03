/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';

export const validateSenderName = (senders) => (value) => {
  if (!value) return 'Required';

  if (!/^[A-Z0-9_]+$/i.test(value)) return 'Invalid sender name';

  const matches = senders.filter((sender) => sender.name === value);
  if (matches.length > 1) return 'Sender name is already being used';
};

export const validateEmailGroupName = (emailGroups) => (value) => {
  if (!value) return 'Required';

  if (!/^[A-Z0-9_-]+$/i.test(value)) {
    return 'Invalid email group name';
  }

  const matches = emailGroups.filter((emailGroup) => emailGroup.name === value);
  if (matches.length > 1) return 'Email group name is already being used';
};

export const validateEmailGroupEmails = (options) => {
  if (_.isEmpty(options)) return 'Must specify an email';

  const invalidEmails = options
    .map((option) => option.label)
    .filter((email) => !isValidEmail(email));
  if (invalidEmails.length > 0) {
    return `Invalid emails: ${invalidEmails.join(', ')}`;
  }
};

export const validateEmail = (value) => {
  if (!value) return 'Required';

  if (!isValidEmail(value)) {
    return 'Invalid email address';
  }
};

export const validateHost = (value) => {
  // SMTP hosts are usually of the format smtp.serveraddress.com
  // but this is not always the case so choosing not to validate the format here
  if (!value) return 'Required';
};

export const validatePort = (value) => {
  if (!value) return 'Required';
};

/**
 * Validating email against a RFC 5322 (https://www.ietf.org/rfc/rfc5322.txt) compliant pattern
 */
export const isValidEmail = (value) =>
  /^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i.test(
    value
  );
