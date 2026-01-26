/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiFlexItem, EuiText } from '@elastic/eui';

const OverviewStat = ({ header, value }) => (
  <EuiFlexItem key={header}>
    <EuiText size="xs">
      <strong>{header}</strong>
      <div style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>{value}</div>
    </EuiText>
  </EuiFlexItem>
);

OverviewStat.propTypes = {
  header: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.element]).isRequired,
};

export default OverviewStat;
