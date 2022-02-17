/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiSpacer } from '@elastic/eui';
import EmailSender from '../../../containers/CreateDestination/EmailSender';
import EmailRecipients from '../../../containers/CreateDestination/EmailRecipients';

const propTypes = {
  httpClient: PropTypes.object.isRequired,
  type: PropTypes.string.isRequired,
  notifications: PropTypes.object.isRequired,
};
const Email = ({ httpClient, type, values, notifications }) => (
  <div>
    <EmailSender httpClient={httpClient} type={type} notifications={notifications} />
    <EuiSpacer size="m" />
    <EmailRecipients httpClient={httpClient} type={type} notifications={notifications} />
  </div>
);

Email.propTypes = propTypes;

export default Email;
