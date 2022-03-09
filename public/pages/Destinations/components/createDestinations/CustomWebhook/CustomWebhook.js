/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiSpacer } from '@elastic/eui';
import HeaderParamsEditor from './HeaderParamsEditor';
import MethodEditor from './MethodEditor';
import URLInfo from './URLInfo';

const propTypes = {
  type: PropTypes.string.isRequired,
};
const CustomWebhook = ({ type, values }) => (
  <div>
    <URLInfo type={type} values={values} />
    <EuiSpacer size="m" />
    <MethodEditor type={type} />
    <EuiSpacer size="m" />
    <HeaderParamsEditor type={type} headerParams={values[type].headerParams} />
  </div>
);

CustomWebhook.propTypes = propTypes;

export default CustomWebhook;
