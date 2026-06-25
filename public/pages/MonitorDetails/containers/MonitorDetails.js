/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import MonitorDetailsV1 from './MonitorDetailsV1';
import MonitorDetailsV2 from './MonitorDetailsV2';
import { getDataSourceQueryObj } from '../../utils/helpers';
import { isPplMonitor as isPplMonitorUtil } from '../../../utils/pplHelpers';
import { getNotifications } from '../../../services';

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
        if (!resp?.ok) throw new Error(JSON.stringify(resp?.resp || resp));
        const monitor = resp?.resp ?? null;
        if (this._isMounted) {
          this.setState({ isPplMonitor: monitor ? isPplMonitorUtil(monitor) : false });
        }
        return;
      }
    } catch (err) {
      getNotifications().toasts.addDanger({
        title: 'Failed to retrieve monitor details.',
        text: err?.message || String(err),
      });
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
