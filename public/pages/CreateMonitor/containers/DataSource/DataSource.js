/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiSpacer } from '@elastic/eui';
import MonitorIndex from '../MonitorIndex';
import MonitorTimeField from '../../components/MonitorTimeField';
import ContentPanel from '../../../../components/ContentPanel';
import { SEARCH_TYPE } from '../../../../utils/constants';

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
    const { searchType } = this.props.values;
    const isGraph = searchType === SEARCH_TYPE.GRAPH;
    return (
      <ContentPanel title="Data source" titleSize="s" bodyStyles={{ padding: 'initial' }}>
        <MonitorIndex httpClient={this.props.httpClient} />
        <EuiSpacer size="s" />
        {isGraph && <MonitorTimeField dataTypes={this.props.dataTypes} />}
      </ContentPanel>
    );
  }
}

DataSource.propTypes = propTypes;

export default DataSource;
