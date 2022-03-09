/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DESTINATION_TYPE } from '../../../utils/constants';
import { RECIPIENT_TYPE } from '../EmailRecipients/utils/constants';

const getCustomWebhookValues = ({ queryParams, headerParams, urlType, ...rest }) => {
  const updatedHeaders = headerParams.reduce(
    (acc, { key, value }) => ({
      ...acc,
      [key]: value,
    }),
    {}
  );
  const updatedQueryParams = queryParams.reduce(
    (acc, { key, value }) => ({
      ...acc,
      [key]: value,
    }),
    {}
  );

  return {
    ...rest,
    port: rest.port ? rest.port : -1,
    header_params: updatedHeaders,
    query_params: updatedQueryParams,
  };
};

const getEmailValues = ({ emailSender, emailRecipients }) => {
  // Sender is required so there should always be one entry in the list
  const emailAccountId = emailSender[0].value;

  const recipients = emailRecipients.map((recipient) =>
    recipient.type === RECIPIENT_TYPE.EMAIL
      ? { type: recipient.type, email: recipient.value }
      : { type: recipient.type, email_group_id: recipient.value }
  );

  return {
    email_account_id: emailAccountId,
    recipients,
  };
};

export const formikToDestination = (values) => {
  const type = values.type;
  const destinationValues = {
    name: values.name,
    type,
  };
  switch (type) {
    case DESTINATION_TYPE.CUSTOM_HOOK:
      destinationValues[type] = getCustomWebhookValues(values[type]);
      break;
    case DESTINATION_TYPE.EMAIL:
      destinationValues[type] = getEmailValues(values[type]);
      break;
    case DESTINATION_TYPE.SLACK:
    case DESTINATION_TYPE.CHIME:
      destinationValues[type] = values[type];
      break;
  }
  return destinationValues;
};
