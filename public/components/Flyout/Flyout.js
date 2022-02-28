/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiFlyout, EuiFlyoutBody, EuiFlyoutHeader, EuiFlyoutFooter } from '@elastic/eui';

import Flyouts from './flyouts';

const getFlyoutData = ({ type, payload }) => {
  const flyout = Flyouts[type];
  if (!flyout || typeof flyout !== 'function') return null;
  return flyout(payload);
};

const propTypes = {
  flyout: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

const Flyout = ({ flyout, onClose }) => {
  if (!flyout) return null;
  const flyoutData = getFlyoutData(flyout);
  if (!flyoutData) return null;
  const {
    flyoutProps = {},
    headerProps = {},
    bodyProps = {},
    footerProps = {},
    header = null,
    body = null,
    footer = null,
  } = flyoutData;

  const flyoutHeader = header && <EuiFlyoutHeader {...headerProps}>{header}</EuiFlyoutHeader>;
  const flyoutBody = body && <EuiFlyoutBody {...bodyProps}>{body}</EuiFlyoutBody>;
  const flyoutFooter = footer && <EuiFlyoutFooter {...footerProps}>{footer}</EuiFlyoutFooter>;

  return (
    <EuiFlyout onClose={onClose} {...flyoutProps}>
      {flyoutHeader}
      {flyoutBody}
      {flyoutFooter}
    </EuiFlyout>
  );
};

Flyout.propTypes = propTypes;

export default Flyout;
