/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiSpacer } from '@elastic/eui';
import MonitorIndex from '../MonitorIndex';
import MonitorTimeField from '../../components/MonitorTimeField';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import MinimalAccordion from '../../../../components/FeatureAnywhereContextMenu/MinimalAccordion';

interface DataSourceProps {
  values: Object;
  dataTypes: Object;
  httpClient: Object;
  notifications: Object;
  isMinimal: boolean;
  canCallGetRemoteIndexes: boolean;
  remoteMonitoringEnabled: boolean;
}
interface DataSourceState {
  performanceResponse: null | any;
  response: null | any;
  formikSnapshot: Object;
  accordionOpen: boolean;
}

const propTypes = {
  values: PropTypes.object.isRequired,
  dataTypes: PropTypes.object.isRequired,
  httpClient: PropTypes.object.isRequired,
  notifications: PropTypes.object.isRequired,
  isMinimal: PropTypes.bool,
  canCallGetRemoteIndexes: PropTypes.bool,
  remoteMonitoringEnabled: PropTypes.bool,
};
const defaultProps = {
  isMinimal: false,
};
class DataSourceFlyout extends Component<DataSourceProps, DataSourceState> {
  constructor(props: DataSourceProps) {
    super(props);

    this.state = {
      performanceResponse: null,
      response: null,
      formikSnapshot: this.props.values,
      accordionOpen: false,
    };
  }

  render() {
    const { canCallGetRemoteIndexes, remoteMonitoringEnabled } = this.props;
    // @ts-ignore
    const { monitor_type, searchType } = this.props.values;
    const displayTimeField =
      searchType === SEARCH_TYPE.GRAPH &&
      monitor_type !== MONITOR_TYPE.DOC_LEVEL &&
      monitor_type !== MONITOR_TYPE.CLUSTER_METRICS;
    const monitorIndexDisplay = (
      <>
        <MonitorIndex
          httpClient={this.props.httpClient}
          monitorType={monitor_type}
          canCallGetRemoteIndexes={canCallGetRemoteIndexes}
          remoteMonitoringEnabled={remoteMonitoringEnabled}
        />

        {displayTimeField && (
          <>
            <EuiSpacer />
            <MonitorTimeField dataTypes={this.props.dataTypes} />
          </>
        )}
      </>
    );

    return (
      <><MinimalAccordion
        {...{
          id: 'dataSource',
          isOpen: this.state.accordionOpen,
          onToggle: () => {this.setState({accordionOpen: !this.state.accordionOpen})},
          title: 'Data Source',
          subTitle: `Index: [${this.state.formikSnapshot.index.map((index: {label: string} )=> index.label).join(",")}],  timeField: ${this.state.formikSnapshot.timeField}`
          ,
        }}
      >
        {monitorIndexDisplay}
      </MinimalAccordion><EuiSpacer size="xs" /></>
    );
  }
}

DataSourceFlyout.propTypes = propTypes;
DataSourceFlyout.defaultProps = defaultProps;

export default DataSourceFlyout;
