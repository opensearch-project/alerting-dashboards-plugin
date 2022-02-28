/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DESTINATION_TYPE } from '../../../utils/constants';

export const URL_TYPE = {
  FULL_URL: 'url',
  ATTRIBUTE_URL: 'custom_url',
};

export const CONTENT_TYPE_KEY = 'Content-Type';

const DEFAULT_CONTENT_VALUE = 'application/json';
// TODO:: Change once we have complex forms for the URL like custom webhook
export const formikInitialValues = {
  urlType: 'url',
  name: '',
  type: 'slack',
  [DESTINATION_TYPE.SLACK]: {
    url: '',
  },
  [DESTINATION_TYPE.CHIME]: {
    url: '',
  },
  [DESTINATION_TYPE.CUSTOM_HOOK]: {
    urlType: URL_TYPE.FULL_URL,
    scheme: 'HTTPS',
    method: 'POST',
    headerParams: [
      {
        key: CONTENT_TYPE_KEY,
        value: DEFAULT_CONTENT_VALUE,
      },
    ],
    queryParams: [
      {
        key: '',
        value: '',
      },
    ],
  },
  [DESTINATION_TYPE.EMAIL]: {
    emailSender: [],
    emailRecipients: [],
  },
};
