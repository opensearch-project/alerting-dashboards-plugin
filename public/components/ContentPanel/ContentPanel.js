/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiPanel, EuiText } from '@elastic/eui';

const ContentPanel = ({
  title = '',
  titleSize = 's',
  description = '',
  descriptionSize = 'xs',
  bodyStyles = {},
  panelStyles = {},
  horizontalRuleClassName = '',
  actions,
  children,
  panelOptions = {},
}) => (
  <EuiPanel style={{ paddingLeft: '0px', paddingRight: '0px', ...panelStyles }}>
    <EuiFlexGroup style={{ padding: '0px 10px' }} justifyContent="spaceBetween" alignItems="center">
      <EuiFlexItem>
        <EuiText size={titleSize}>
          <h2>{title}</h2>
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          {Array.isArray(actions) ? (
            actions.map((action, idx) => <EuiFlexItem key={idx}>{action}</EuiFlexItem>)
          ) : (
            <EuiFlexItem>{actions}</EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiText style={{ padding: '0px 10px' }} size={descriptionSize} color="subdued">
      {description}
    </EuiText>
    {!panelOptions.hideTitleBorder && (
      <EuiHorizontalRule margin="xs" className={horizontalRuleClassName} />
    )}

    <div style={{ padding: '0px 10px', ...bodyStyles }}>{children}</div>
  </EuiPanel>
);

ContentPanel.propTypes = {
  title: PropTypes.string,
  titleSize: PropTypes.string,
  bodyStyles: PropTypes.object,
  panelStyles: PropTypes.object,
  horizontalRuleClassName: PropTypes.string,
  actions: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf([PropTypes.node])]),
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf([PropTypes.node])]).isRequired,
};

export default ContentPanel;
