/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback, useEffect, useState } from "react";
import { EuiBadge, EuiDescriptionList, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiLink, EuiLoadingContent, EuiPanel, EuiSmallButtonEmpty, EuiText, EuiTitle } from "@elastic/eui";
import { DataSourceManagementPluginSetup, DataSourceOption } from "../../../../../src/plugins/data_source_management/public";
import { getApplication, getClient, getNotifications, getSavedObjectsClient } from "../../services";
import { dataSourceFilterFn, getSeverityColor, getSeverityText, getTruncatedText } from "../../utils/helpers";
import { renderTime } from "../../pages/Dashboard/utils/tableUtils";
import { ALERTS_NAV_ID } from "../../../utils/constants";
import { DEFAULT_EMPTY_DATA } from "../../utils/constants";

export interface DataSourceAlertsCardProps {
  getDataSourceMenu: DataSourceManagementPluginSetup['ui']['getDataSourceMenu'];
}

export const DataSourceAlertsCard: React.FC<DataSourceAlertsCardProps> =  ({ getDataSourceMenu }) => {
  const DataSourceSelector = getDataSourceMenu();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<DataSourceOption>({
    label: 'Local cluster',
    id: '',
  });
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    getClient().get('../api/alerting/alerts', { 
      query: {
        size: 25,
        sortField: 'start_time',
        dataSourceId: dataSource?.id || '',
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

  const onDataSourceSelected = useCallback((options: any[]) => {
    if (dataSource?.id !== undefined && dataSource?.id !== options[0]?.id) {
      setDataSource(options[0]);
    }
  }, [dataSource]);

  const createAlertDetailsHeader = useCallback((alert) => {
    const severityColor = getSeverityColor(alert.severity);
    const triggerName = alert.trigger_name ?? DEFAULT_EMPTY_DATA;
    
    return (
      <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem grow={false}>
          <div>
            <EuiBadge color={severityColor?.background} style={{ padding: '1px 4px', color: severityColor?.text }}>{getSeverityText(alert.severity)}</EuiBadge>
            &nbsp;&nbsp;
            <span style={{ color: "#006BB4" }} className="eui-textTruncate">{getTruncatedText(triggerName)}</span>
          </div>
        </EuiFlexItem>
        <EuiFlexItem grow={false} >
          <EuiText color="subdued" size="s">{renderTime(alert.start_time, { showFromNow: true })}</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }, []);

  const createAlertDetailsDescription = useCallback((alert) => {
    const monitorName = alert.monitor_name ?? DEFAULT_EMPTY_DATA;

    return (
      <>
        <EuiFlexGroup gutterSize="s" justifyContent="flexStart" alignItems="center">
          <EuiFlexItem grow={false}>
            <EuiText size="s" color="subdued">Monitor:</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false} >
            <EuiText size="m">{getTruncatedText(monitorName)}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiHorizontalRule margin="xs" />
      </>
    )
  }, []);

  return (
    <EuiPanel hasBorder={false} hasShadow={false}>
      <EuiFlexGroup style={{ height: '100%' }} direction="column" justifyContent="spaceBetween" alignItems="flexStart" gutterSize="xs">
        <EuiFlexItem grow={false} style={{ width: '100%' }}>
          <EuiFlexGroup direction="column">
            <EuiFlexItem>
              <EuiFlexGroup gutterSize="s" justifyContent="spaceBetween">
                <EuiFlexItem grow={false}>
                  <EuiTitle size="s">
                    <h3>
                      Recent alerts
                    </h3>
                  </EuiTitle>
                </EuiFlexItem>
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
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem>
              {loading ? (
                <EuiLoadingContent />
              ) : (
                <EuiDescriptionList
                  listItems={alerts.map((alert, idx) => {
                    return {
                      title: createAlertDetailsHeader(alert),
                      description: createAlertDetailsDescription(alert)
                    }
                  })}
                />
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiLink href={getApplication().getUrlForApp(ALERTS_NAV_ID, { path: '#/dasboard' })} target="_blank"><EuiText size="s" className="eui-displayInline">View all</EuiText></EuiLink>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  )
};