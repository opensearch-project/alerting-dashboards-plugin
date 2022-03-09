/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import PropTypes from 'prop-types';
import React from 'react';

const ChartContainer = ({ children, style }) => (
  <div
    style={{
      borderRadius: '5px',
      padding: '10px',
      border: '1px solid #D9D9D9',
      height: '250px',
      width: '100%',
      ...style,
    }}
  >
    {children}
  </div>
);
ChartContainer.propTypes = {
  style: PropTypes.object,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf([PropTypes.node])]).isRequired,
};
ChartContainer.defaultPropTypes = {
  style: {},
};

export { ChartContainer };
