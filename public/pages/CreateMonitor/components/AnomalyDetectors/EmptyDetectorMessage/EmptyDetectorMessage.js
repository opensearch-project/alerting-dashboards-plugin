/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiEmptyPrompt, EuiText } from '@elastic/eui';

const EmptyDetectorMessage = (props) => (
  <div
    style={{
      borderRadius: '5px',
      padding: '10px',
      border: '1px solid #D9D9D9',
      height: '250px',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...props.containerStyle,
    }}
  >
    <EuiEmptyPrompt
      style={{ maxWidth: '45em' }}
      body={<EuiText>You must specify a detector.</EuiText>}
    />
  </div>
);

EmptyDetectorMessage.propTypes = {
  containerStyle: PropTypes.object,
};
EmptyDetectorMessage.defaultProps = {
  containerStyle: {},
};

export { EmptyDetectorMessage };
