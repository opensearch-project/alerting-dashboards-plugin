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
      <div>{value}</div>
    </EuiText>
  </EuiFlexItem>
);

OverviewStat.propTypes = {
  header: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default OverviewStat;
