/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiSpacer } from '@elastic/eui';
import MonitorIndex from '../MonitorIndex';
import MonitorTimeField from '../../components/MonitorTimeField';
import ContentPanel from '../../../../components/ContentPanel';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';

const propTypes = {
  values: PropTypes.object.isRequired,
  dataTypes: PropTypes.object.isRequired,
  httpClient: PropTypes.object.isRequired,
  notifications: PropTypes.object.isRequired,
};

class DataSource extends Component {
  constructor(props) {
    super(props);

    this.state = {
      performanceResponse: null,
      response: null,
      formikSnapshot: this.props.values,
    };
  }

  render() {
    const { monitor_type, searchType } = this.props.values;
    const displayTimeField =
      searchType === SEARCH_TYPE.GRAPH && monitor_type !== MONITOR_TYPE.DOC_LEVEL;
    return (
      <ContentPanel
        title="Data source"
        titleSize="s"
        panelStyles={{ paddingLeft: '10px', paddingRight: '10px' }}
        bodyStyles={{ padding: 'initial' }}
      >
        <MonitorIndex httpClient={this.props.httpClient} monitorType={monitor_type} />
        <EuiSpacer size="s" />
        {displayTimeField && <MonitorTimeField dataTypes={this.props.dataTypes} />}
      </ContentPanel>
    );
  }
}

DataSource.propTypes = propTypes;

export default DataSource;
