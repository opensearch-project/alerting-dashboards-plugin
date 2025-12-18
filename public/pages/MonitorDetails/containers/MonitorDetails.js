/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import MonitorDetailsV1 from './MonitorDetailsV1';
import MonitorDetailsV2 from './MonitorDetailsV2';
import { MONITOR_ACTIONS } from '../../../utils/constants';
import { getDataSourceQueryObj } from '../../utils/helpers';

/**
 * Router component that decides whether to show v1 or v2 MonitorDetails
 * based on the viewMode (classic vs new) stored in localStorage
 */
export default class MonitorDetails extends Component {
  state = {
    resolvedViewMode: undefined,
  };

  componentDidMount() {
    this._isMounted = true;
    this.resolveViewMode();
  }

  componentDidUpdate(prevProps) {
    const locationChanged =
      prevProps.location?.search !== this.props.location?.search ||
      prevProps.match?.params?.monitorId !== this.props.match?.params?.monitorId;
    if (locationChanged) {
      this.resolveViewMode();
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  getBaseViewMode = () => {
    // Check URL params first
    const searchParams = new URLSearchParams(this.props.location.search);
    const urlViewMode = searchParams.get('viewMode');
    if (urlViewMode === 'classic' || urlViewMode === 'new') {
      return urlViewMode;
    }

    // Fall back to localStorage
    try {
      const stored = localStorage.getItem('alerting_monitors_view_mode');
      if (stored === 'classic' || stored === 'new') {
        return stored;
      }
    } catch (e) {
      console.error('Error reading viewMode from localStorage:', e);
    }

    // Default to 'new' mode
    return 'new';
  };

  isV2Monitor = (monitor) => {
    if (!monitor) return false;
    if (monitor.monitor_v2 || monitor.ppl_monitor) return true;
    const queryLanguage = monitor.query_language || monitor.queryLanguage;
    if (typeof queryLanguage === 'string' && queryLanguage.toLowerCase() === 'ppl') {
      return true;
    }
    return false;
  };

  resolveViewMode = async () => {
    const baseViewMode = this.getBaseViewMode();
    const searchParams = new URLSearchParams(this.props.location.search);
    const isEditAction = searchParams.get('action') === MONITOR_ACTIONS.EDIT_MONITOR;

    if (!isEditAction) {
      if (this._isMounted) {
        this.setState({ resolvedViewMode: baseViewMode });
      }
      return;
    }

    let resolvedViewMode = baseViewMode;
    try {
      const dataSourceQuery = getDataSourceQueryObj();
      const monitorId = this.props.match?.params?.monitorId;
      if (monitorId) {
        const resp = await this.props.httpClient.get(
          `../api/alerting/monitors/${encodeURIComponent(monitorId)}`,
          dataSourceQuery
        );
        const monitor = resp?.resp;
        if (monitor) {
          resolvedViewMode = this.isV2Monitor(monitor) ? 'new' : 'classic';
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('MonitorDetails: unable to determine monitor type for edit view', err);
      resolvedViewMode = baseViewMode;
    }

    if (this._isMounted) {
      this.setState({ resolvedViewMode });
    }
  };

  render() {
    const searchParams = new URLSearchParams(this.props.location.search);
    const isEditAction = searchParams.get('action') === MONITOR_ACTIONS.EDIT_MONITOR;
    const viewMode =
      this.state.resolvedViewMode !== undefined
        ? this.state.resolvedViewMode
        : isEditAction
        ? undefined
        : this.getBaseViewMode();

    if (viewMode === undefined) {
      return null;
    }

    // Route to the appropriate MonitorDetails version
    if (viewMode === 'classic') {
      return <MonitorDetailsV1 {...this.props} />;
    } else {
      return <MonitorDetailsV2 {...this.props} />;
    }
  }
}

