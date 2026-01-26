/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import MonitorDetailsV1 from './MonitorDetailsV1';
import MonitorDetailsV2 from './MonitorDetailsV2';
import { MONITOR_ACTIONS } from '../../../utils/constants';
import { getDataSourceQueryObj } from '../../utils/helpers';
import { isPplAlertingEnabled } from '../../../services';
import { isPplMonitor as isPplMonitorUtil } from '../../../utils/pplHelpers';

/**
 * Router component that decides whether to show v1 or v2 MonitorDetails
 * based on the stored view mode and monitor type (for edit flow)
 */
export default class MonitorDetailsRouter extends Component {
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
    const searchParams = new URLSearchParams(this.props.location.search);
    const requestedMode = searchParams.get('mode');
    if (requestedMode === 'classic' || requestedMode === 'new') {
      return requestedMode;
    }

    const urlViewMode = searchParams.get('viewMode');
    if (urlViewMode === 'classic' || urlViewMode === 'new') {
      return urlViewMode;
    }

    try {
      const stored = localStorage.getItem('alerting_monitors_view_mode');
      if (stored === 'classic' || stored === 'new') {
        return stored;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error reading viewMode from localStorage:', e);
    }

    return 'new';
  };

  resolveViewMode = async () => {
    const baseViewMode = this.getBaseViewMode();
    const searchParams = new URLSearchParams(this.props.location.search);
    const isEditAction = searchParams.get('action') === MONITOR_ACTIONS.EDIT_MONITOR;
    const pplEnabled = isPplAlertingEnabled();
    const requestedMode = searchParams.get('mode');
    const forceClassic = requestedMode === 'classic' || baseViewMode === 'classic';

    if (!isEditAction) {
      if (this._isMounted) {
        this.setState({ resolvedViewMode: pplEnabled ? baseViewMode : 'classic' });
      }
      return;
    }

    let resolvedViewMode = baseViewMode;
    try {
      const dataSourceQuery = getDataSourceQueryObj();
      const monitorId = this.props.match?.params?.monitorId;
      if (monitorId) {
        let monitor = null;
        const shouldStayOnV2 = pplEnabled && baseViewMode === 'new';

        if (pplEnabled && !forceClassic) {
          try {
            const pplResp = await this.props.httpClient.get(
              `../api/alerting/v2/monitors/${encodeURIComponent(monitorId)}`,
              dataSourceQuery
            );
            monitor = pplResp?.resp ?? null;
          } catch (e) {
            // stay silent; fallback handled below if needed
          }
        }

        if (!monitor && !shouldStayOnV2) {
          try {
            const legacyResp = await this.props.httpClient.get(
              `../api/alerting/monitors/${encodeURIComponent(monitorId)}`,
              dataSourceQuery
            );
            monitor = legacyResp?.resp ?? null;
          } catch (e) {
            // legacy endpoint may not exist; swallow and use base view mode
            console.log('[MonitorDetailsRouter] v1 monitor fetch error', e);
          }
        }

        if (monitor) {
          resolvedViewMode = isPplMonitorUtil(monitor) ? 'new' : 'classic';
        } else if (shouldStayOnV2) {
          resolvedViewMode = 'new';
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('MonitorDetails: unable to determine monitor type for edit view', err);
      resolvedViewMode = baseViewMode;
    }

    if (!pplEnabled) {
      resolvedViewMode = 'classic';
    }

    if (this._isMounted) {
      this.setState({ resolvedViewMode });
    }
  };

  render() {
    const searchParams = new URLSearchParams(this.props.location.search);
    const isEditAction = searchParams.get('action') === MONITOR_ACTIONS.EDIT_MONITOR;
    const pplEnabled = isPplAlertingEnabled();
    const { resolvedViewMode } = this.state;

    if (pplEnabled && resolvedViewMode === undefined) {
      return null;
    }

    const viewMode =
      resolvedViewMode !== undefined
        ? resolvedViewMode
        : isEditAction
        ? undefined
        : this.getBaseViewMode();

    if (viewMode === undefined) {
      return null;
    }

    if (viewMode === 'classic' || !pplEnabled) {
      return <MonitorDetailsV1 {...this.props} viewMode="classic" />;
    }

    return <MonitorDetailsV2 {...this.props} viewMode="new" />;
  }
}
