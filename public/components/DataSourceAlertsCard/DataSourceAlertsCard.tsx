/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EuiBadge, EuiDescriptionList, EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiLink, EuiLoadingContent, EuiPanel, EuiText, EuiTitle } from "@elastic/eui";
import { DataSourceManagementPluginSetup, DataSourceOption } from "../../../../../src/plugins/data_source_management/public";
import { getApplication, getClient, getNotifications, getSavedObjectsClient } from "../../services";
import { dataSourceFilterFn, getSeverityColor, getSeverityBadgeText, getTruncatedText } from "../../utils/helpers";
import { renderTime } from "../../pages/Dashboard/utils/tableUtils";
import { ALERTS_NAV_ID, MONITORS_NAV_ID } from "../../../utils/constants";
import { APP_PATH, DEFAULT_EMPTY_DATA } from "../../utils/constants";
import { dataSourceEnabled, getIsAgentConfigured, getURL } from "../../pages/utils/helpers.js";
import { AlertInsight } from '../AlertInsight';

export interface DataSourceAlertsCardProps {
  getDataSourceMenu?: DataSourceManagementPluginSetup['ui']['getDataSourceMenu'];
}

export const DataSourceAlertsCard: React.FC<DataSourceAlertsCardProps> =  ({ getDataSourceMenu }) => {
  const DataSourceSelector = useMemo(() => {
    if (getDataSourceMenu) {
      return getDataSourceMenu();
    }

    return null;
  }, [getDataSourceMenu]);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<DataSourceOption>();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [agentAvailable, setAgentAvailable] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    getClient().get('../api/alerting/alerts', {
      query: {
        size: 25,
        sortField: 'start_time',
        ...(dataSourceEnabled() && { dataSourceId: dataSource?.id || ''}),
        sortDirection: 'desc'
      }
    }).then(res => {
      if (res.ok) {
        setAlerts(res.alerts);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    })
  }, [dataSource]);

  useEffect(() => {
    const checkAgentConfig = async () => {
      const isConfigured = await getIsAgentConfigured(dataSource?.id);
      setAgentAvailable(isConfigured);
    };

    checkAgentConfig();
  }, [dataSource?.id]);

  const onDataSourceSelected = useCallback((options: any[]) => {
    if (dataSource?.id === undefined || dataSource?.id !== options[0]?.id) {
      setDataSource(options[0]);
    }
  }, [dataSource]);

  const createAlertDetailsHeader = useCallback((alert) => {
    const severityColor = getSeverityColor(alert.severity);
    const triggerName = alert.trigger_name ?? DEFAULT_EMPTY_DATA;
    const monitorUrl = `${MONITORS_NAV_ID}#/monitors/${
      alert.alert_source === 'workflow' ? alert.workflow_id : alert.monitor_id
    }?&type=${alert.alert_source}`;
    const url = getURL(monitorUrl, dataSource?.id);
    const alertId = `alerts_${alert.id}`;
    return (
      <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem grow={false}>
            <AlertInsight
              alert={alert}
              isAgentConfigured={agentAvailable}
              alertId={alertId}
              datasourceId={dataSource?.id}
            >
              <div key={alertId}>
                <EuiBadge color={severityColor?.background} style={{ padding: '1px 4px', color: severityColor?.text }}>{getSeverityBadgeText(alert.severity)}</EuiBadge>
                &nbsp;&nbsp;
                <EuiLink href={url}>
                  <span style={{ color: '#006BB4' }} className="eui-textTruncate">
                    {getTruncatedText(triggerName)}
                  </span>
                </EuiLink>
              </div>
            </AlertInsight>
          </EuiFlexItem>
        <EuiFlexItem grow={false} >
          <EuiText color="subdued" size="s">{renderTime(alert.start_time, { showFromNow: true })}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }, [agentAvailable]);

  const createAlertDetailsDescription = useCallback((alert) => {
    const monitorName = alert.monitor_name ?? DEFAULT_EMPTY_DATA;

    return (
      <>
        <EuiFlexGroup gutterSize="s" justifyContent="flexStart" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiText size="s" color="subdued">Monitor:</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <EuiText size="m" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{monitorName}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiHorizontalRule margin="xs" />
      </>
    )
  }, []);

  const alertsListItems = alerts.map((alert) => {
    return {
      title: createAlertDetailsHeader(alert),
      description: createAlertDetailsDescription(alert)
    }
  });

  return (
    <EuiPanel hasBorder={false} hasShadow={false} style={{ overflow: 'hidden' }}>
      <EuiFlexGroup style={{ height: '100%' }} direction="column" justifyContent="spaceBetween" alignItems="flexStart" gutterSize="xs">
        <EuiFlexItem grow={false} style={{ width: '100%', height: '90%' }}>
          <EuiFlexGroup direction="column" style={{ height: '100%' }}>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween">
                <EuiFlexItem grow={false}>
                  <EuiTitle size="s">
                    <h3>
                      Recent alerts
                    </h3>
                  </EuiTitle>
                </EuiFlexItem>
                {DataSourceSelector && (
                  <EuiFlexItem grow={false}>
                    <DataSourceSelector
                      componentType={"DataSourceSelectable"}
                      componentConfig={{
                        savedObjects: getSavedObjectsClient(),
                        notifications: getNotifications(),
                        onSelectedDataSources: onDataSourceSelected,
                        fullWidth: false,
                        dataSourceFilter: dataSourceFilterFn,
                        activeOption: dataSource ? [{ id: dataSource.id }] : undefined
                      }}
                    />
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem style={{ overflow: 'scroll' }}>
              {loading ? (
                <EuiLoadingContent />
              ) : alertsListItems.length > 0 ? (
                <EuiDescriptionList
                  listItems={alertsListItems}
                />
              ) : (
                <EuiEmptyPrompt
                  body={(
                    <EuiText>
                      <div>There are no existing alerts.</div>
                      <EuiLink target="_blank" href={`${MONITORS_NAV_ID}#${APP_PATH.CREATE_MONITOR}`}>Create</EuiLink> a monitor to add triggers and actions.
                    </EuiText>
                  )}
                />
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiLink href={getApplication().getUrlForApp(ALERTS_NAV_ID, { path: '#/dashboard' })}><EuiText size="s" className="eui-displayInline">View all</EuiText></EuiLink>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  )
};
