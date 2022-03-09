/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { URL_TYPE, CONTENT_TYPE_KEY } from './constants';
import { DESTINATION_TYPE } from '../../../utils/constants';
import { RECIPIENT_TYPE } from '../EmailRecipients/utils/constants';

const getAttributeArrayFromValues = (attributes) =>
  Object.keys(attributes).map((currentKey) => ({
    key: currentKey,
    value: attributes[currentKey],
  }));

const customWebhookToFormik = ({
  query_params: queryParams = {},
  header_params: headerParams = {},
  port,
  url,
  ...rest
}) => {
  const updatedValues = {};
  const { [CONTENT_TYPE_KEY]: contentType, ...otherHeaders } = headerParams;
  updatedValues.headerParams = [
    { key: CONTENT_TYPE_KEY, value: contentType },
    ...getAttributeArrayFromValues(otherHeaders || {}),
  ];
  updatedValues.queryParams = getAttributeArrayFromValues(queryParams);
  updatedValues.port = port === -1 ? null : port;
  updatedValues.urlType = _.isEmpty(url) ? URL_TYPE.ATTRIBUTE_URL : URL_TYPE.FULL_URL;
  return {
    ...rest,
    ...updatedValues,
    url,
  };
};

const getSender = async (httpClient, id) => {
  try {
    const response = await httpClient.get(`../api/alerting/destinations/email_accounts/${id}`);
    if (response.ok) {
      return response.resp;
    }
    return null;
  } catch (err) {
    console.log('Unable to get email account', err);
    return null;
  }
};

const getEmailGroup = async (httpClient, id) => {
  try {
    const response = await httpClient.get(`../api/alerting/destinations/email_groups/${id}`);
    if (response.ok) {
      return response.resp;
    }
    return null;
  } catch (err) {
    console.log('Unable to get email group', err);
    return null;
  }
};

const emailToFormik = async (httpClient, email) => {
  const senderId = email.email_account_id;
  const sender = await getSender(httpClient, senderId);
  const senderValue = !sender ? [] : [{ label: sender.name, value: senderId }];

  let recipientValues = [];
  for (const recipient of email.recipients) {
    if (recipient.type === RECIPIENT_TYPE.EMAIL) {
      recipientValues.push({
        label: recipient.email,
        value: recipient.email,
        type: RECIPIENT_TYPE.EMAIL,
      });
    } else {
      const emailGroup = await getEmailGroup(httpClient, recipient.email_group_id);
      if (emailGroup) {
        recipientValues.push({
          label: emailGroup.name,
          value: recipient.email_group_id,
          type: RECIPIENT_TYPE.EMAIL_GROUP,
        });
      }
    }
  }

  return {
    emailSender: senderValue,
    emailRecipients: recipientValues,
  };
};

export const destinationToFormik = async (httpClient, values) => {
  const updatedValues = { ..._.omit(values, ['id', 'version', 'last_update_time']) };
  if (values.type === DESTINATION_TYPE.CUSTOM_HOOK) {
    const customWebhookValues = customWebhookToFormik(updatedValues[values.type]);
    updatedValues[values.type] = { ...customWebhookValues };
  } else if (values.type === DESTINATION_TYPE.EMAIL) {
    const emailValues = await emailToFormik(httpClient, updatedValues[values.type]);
    updatedValues[values.type] = { ...emailValues };
  }
  return updatedValues;
};
