/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiSpacer } from '@elastic/eui';
import MonitorRoles from '../MonitorRoles';
import ContentPanel from '../../../../components/ContentPanel';

const propTypes = {
  values: PropTypes.object.isRequired,
  httpClient: PropTypes.object.isRequired,
  isMinimal: PropTypes.bool,
};
const defaultProps = {
  isMinimal: false,
};
class MonitorSecurity extends Component {
  constructor(props) {
    super(props);

    this.state = {
      response: null,
    };
  }

  render() {
    const { isMinimal } = this.props;
    const monitorRoleDisplay = (
      <>
        <MonitorRoles httpClient={this.props.httpClient} />
      </>
    );

    if (isMinimal) {
      return { monitorRoleDisplay };
    }
    return (
      <ContentPanel
        title="Monitor security"
        titleSize="s"
        panelStyles={{ paddingLeft: '10px', paddingRight: '10px' }}
        bodyStyles={{ padding: 'initial' }}
      >
        {monitorRoleDisplay}
      </ContentPanel>
    );
  }
}

MonitorSecurity.propTypes = propTypes;
MonitorSecurity.defaultProps = defaultProps;

export default MonitorSecurity;
