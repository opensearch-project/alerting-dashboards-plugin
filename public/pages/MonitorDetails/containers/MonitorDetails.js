/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import MonitorDetailsV1 from './MonitorDetailsV1';
import MonitorDetailsV2 from './MonitorDetailsV2';
import { getDataSourceQueryObj } from '../../utils/helpers';
import { isPplMonitor as isPplMonitorUtil } from '../../../utils/pplHelpers';

export default class MonitorDetailsRouter extends Component {
  state = {
    isPplMonitor: undefined,
  };

  componentDidMount() {
    this._isMounted = true;
    this.resolveMonitorType();
  }

  componentDidUpdate(prevProps) {
    const locationChanged =
      prevProps.location?.search !== this.props.location?.search ||
      prevProps.match?.params?.monitorId !== this.props.match?.params?.monitorId;
    if (locationChanged) {
      this.resolveMonitorType();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  resolveMonitorType = async () => {
    try {
      const dataSourceQuery = getDataSourceQueryObj();
      const monitorId = this.props.match?.params?.monitorId;
      if (monitorId) {
        const resp = await this.props.httpClient.get(
          `../api/alerting/monitors/${encodeURIComponent(monitorId)}`,
          dataSourceQuery
        );
        const monitor = resp?.resp ?? null;
        if (this._isMounted) {
          this.setState({ isPplMonitor: monitor ? isPplMonitorUtil(monitor) : false });
        }
        return;
      }
    } catch (err) {
      console.error('MonitorDetails: unable to determine monitor type', err);
    }

    if (this._isMounted) this.setState({ isPplMonitor: false });
  };

  render() {
    const { isPplMonitor } = this.state;

    if (isPplMonitor === undefined) {
      return null;
    }

    if (isPplMonitor) {
      return <MonitorDetailsV2 {...this.props} />;
    }

    return <MonitorDetailsV1 {...this.props} />;
  }
}
