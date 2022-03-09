/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiIcon, EuiToolTip } from '@elastic/eui';

const IconToolTip = ({ iconType, content, position = 'top' }) => (
  <EuiToolTip position={position} content={content}>
    <EuiIcon type={iconType} />
  </EuiToolTip>
);

IconToolTip.propTypes = {
  iconType: PropTypes.string.isRequired,
  content: PropTypes.string,
  position: PropTypes.string,
};

export default IconToolTip;
