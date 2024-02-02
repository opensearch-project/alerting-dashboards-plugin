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
  isMinimal: PropTypes.bool,
};
const defaultProps = {
  isMinimal: false,
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
    const { isMinimal } = this.props;
    const { monitor_type, searchType } = this.props.values;
    const displayTimeField =
      searchType === SEARCH_TYPE.GRAPH &&
      monitor_type !== MONITOR_TYPE.DOC_LEVEL &&
      monitor_type !== MONITOR_TYPE.CLUSTER_METRICS;
    const monitorIndexDisplay = (
      <>
        <MonitorIndex httpClient={this.props.httpClient} monitorType={monitor_type} />
        {displayTimeField && (
          <>
            <EuiSpacer />
            <MonitorTimeField dataTypes={this.props.dataTypes} />
          </>
        )}
      </>
    );

    if (isMinimal) {
      return { monitorIndexDisplay };
    }
    return (
      <ContentPanel
        title="Data source"
        titleSize="s"
        panelStyles={{ paddingLeft: '10px', paddingRight: '10px' }}
        bodyStyles={{ padding: 'initial' }}
      >
        {monitorIndexDisplay}
      </ContentPanel>
    );
  }
}

DataSource.propTypes = propTypes;
DataSource.defaultProps = defaultProps;

export default DataSource;
