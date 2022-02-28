/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const METHOD_TYPE = {
  NONE: 'none',
  SSL: 'ssl',
  TLS: 'starttls',
};

export const STATE = {
  NO_OP: 'no_op',
  UPDATED: 'updated',
  CREATED: 'created',
};

export const FORMIK_INITIAL_SENDER_VALUES = {
  name: '',
  email: '',
  host: '',
  port: '',
  method: METHOD_TYPE.NONE,
  state: STATE.CREATED,
};

export const FORMIK_INITIAL_EMAIL_GROUP_VALUES = {
  name: '',
  emails: [],
  state: STATE.CREATED,
};
