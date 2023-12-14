/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiPanel,
  EuiTitle,
  EuiText,
} from '@elastic/eui';
import { IncontextInsightComponent } from './../../plugin';

const ContentPanel = ({
  title = '',
  titleSize = 'l',
  description = '',
  descriptionSize = 'xs',
  bodyStyles = {},
  panelStyles = {},
  horizontalRuleClassName = '',
  actions,
  children,
}) => (
  <EuiPanel style={{ paddingLeft: '0px', paddingRight: '0px', ...panelStyles }}>
    <EuiFlexGroup style={{ padding: '0px 10px' }} justifyContent="spaceBetween" alignItems="center">
      <EuiFlexItem>
        <IncontextInsightComponent>
          <EuiTitle key={`content_panel_${title}`} size={titleSize}>
            <h3>{title}</h3>
          </EuiTitle>
        </IncontextInsightComponent>
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
    <EuiHorizontalRule margin="xs" className={horizontalRuleClassName} />

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
