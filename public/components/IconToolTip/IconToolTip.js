/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
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
