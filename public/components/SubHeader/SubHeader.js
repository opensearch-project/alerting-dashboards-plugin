/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { EuiHorizontalRule, EuiText, EuiTitle } from '@elastic/eui';

const DEFAULT_PROPS = { size: 'xs', style: { paddingLeft: '10px' } };
const SubHeader = ({
  description,
  descriptionProps = DEFAULT_PROPS,
  horizontalRuleMargin = 'xs',
  title,
  titleProps = DEFAULT_PROPS,
}) => (
  <Fragment>
    <EuiTitle {...titleProps}>{title}</EuiTitle>
    <EuiHorizontalRule margin={horizontalRuleMargin} />
    <EuiText {...descriptionProps}>{description}</EuiText>
  </Fragment>
);

SubHeader.propTypes = {
  description: PropTypes.node.isRequired,
  descriptionProps: PropTypes.object,
  horizontalRuleMargin: PropTypes.string,
  title: PropTypes.node.isRequired,
  titleProps: PropTypes.object,
};

export default SubHeader;
