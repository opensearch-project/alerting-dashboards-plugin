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

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React from 'react';
import _ from 'lodash';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLink,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { getTime } from '../../../pages/MonitorDetails/components/MonitorOverview/utils/getOverviewStats';
import { PLUGIN_NAME } from '../../../../utils/constants';
import {
  MONITOR_GROUP_BY,
  MONITOR_INPUT_DETECTOR_ID,
  MONITOR_TYPE,
  SEARCH_TYPE,
} from '../../../utils/constants';
import { TRIGGER_TYPE } from '../../../pages/CreateTrigger/containers/CreateTrigger/utils/constants';
import { SEVERITY_OPTIONS } from '../../../pages/CreateTrigger/containers/DefineTrigger/DefineTrigger';
import Dashboard from '../../../pages/Dashboard/containers/Dashboard';
import { UNITS_OF_TIME } from '../../../pages/CreateMonitor/components/MonitorExpressions/expressions/utils/constants';
import { DEFAULT_WHERE_EXPRESSION_TEXT } from '../../../pages/CreateMonitor/components/MonitorExpressions/expressions/utils/whereHelpers';

export const DEFAULT_NUM_FLYOUT_ROWS = 10;

const getBucketLevelGraphConditions = (trigger) => {
  let conditions = _.get(trigger, 'condition.script.source', '-');
  conditions = _.replace(conditions, ' && ', '&AND&');
  conditions = _.replace(conditions, ' || ', '&OR&');
  conditions = conditions.split(/&/);
  return conditions.map((condition, index) => {
    return (
      <p style={{ marginBottom: '0px' }} key={`alerts-dashboard-condition-${index}`}>
        {condition}
      </p>
    );
  });
};

const getSeverityText = (severity) => {
  return _.get(_.find(SEVERITY_OPTIONS, { value: severity }), 'text');
};

const getBucketLevelGraphFilter = (trigger) => {
  const compositeAggFilter = _.get(trigger, 'condition.composite_agg_filter');
  if (_.isEmpty(compositeAggFilter)) return DEFAULT_WHERE_EXPRESSION_TEXT;
  const keyword = _.keys(compositeAggFilter)[0];
  const operator = _.keys(compositeAggFilter[keyword])[0];
  const value = _.get(compositeAggFilter, `${keyword}.${operator}`);
  return `${keyword} ${_.upperCase(operator)}S ${value}`;
};

const alertsDashboard = (payload) => {
  const {
    alerts,
    history,
    httpClient,
    last_notification_time,
    loadingMonitors,
    location,
    monitors,
    monitor_id,
    monitor_name,
    notifications,
    setFlyout,
    start_time,
    triggerID,
    trigger_name,
  } = payload;
  const monitor = _.get(_.find(monitors, { _id: monitor_id }), '_source');
  const monitorType = _.get(monitor, 'monitor_type', MONITOR_TYPE.QUERY_LEVEL);
  const searchType = _.get(monitor, 'ui_metadata.search.searchType', SEARCH_TYPE.GRAPH);
  const detectorId = _.get(monitor, MONITOR_INPUT_DETECTOR_ID);

  const triggerType =
    monitorType === MONITOR_TYPE.QUERY_LEVEL ? TRIGGER_TYPE.QUERY_LEVEL : TRIGGER_TYPE.BUCKET_LEVEL;

  let trigger = _.get(monitor, 'triggers', []).find((trigger) => {
    return trigger[triggerType].id === triggerID;
  });
  trigger = _.get(trigger, triggerType);

  const severity = _.get(trigger, 'severity');
  const groupBy = _.get(monitor, MONITOR_GROUP_BY);

  const condition =
    monitorType === MONITOR_TYPE.BUCKET_LEVEL && searchType === SEARCH_TYPE.GRAPH
      ? getBucketLevelGraphConditions(trigger)
      : _.get(trigger, 'condition.script.source', '-');

  const filters =
    monitorType === MONITOR_TYPE.BUCKET_LEVEL && searchType === SEARCH_TYPE.GRAPH
      ? getBucketLevelGraphFilter(trigger)
      : '-';

  const bucketValue = _.get(monitor, 'ui_metadata.search.bucketValue');
  let bucketUnitOfTime = _.get(monitor, 'ui_metadata.search.bucketUnitOfTime');
  UNITS_OF_TIME.map((entry) => {
    if (entry.value === bucketUnitOfTime) bucketUnitOfTime = entry.text;
  });
  const timeRangeForLast =
    bucketValue !== undefined && !_.isEmpty(bucketUnitOfTime)
      ? `${bucketValue} ${bucketUnitOfTime}`
      : '-';

  return {
    flyoutProps: {
      'aria-labelledby': 'alertsDashboardFlyout',
      size: 'm',
      hideCloseButton: true,
    },
    headerProps: { hasBorder: true },
    header: (
      <EuiText>
        <h2>{`Alerts by ${trigger_name}`}</h2>
      </EuiText>
    ),
    footerProps: { style: { backgroundColor: '#F5F7FA' } },
    footer: (
      <EuiButtonEmpty
        iconType={'cross'}
        onClick={() => setFlyout(null)}
        style={{ paddingLeft: '0px', marginLeft: '0px' }}
      >
        Close
      </EuiButtonEmpty>
    ),
    body: (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>Trigger name</strong>
              <p>{trigger_name}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>Severity</strong>
              <p>{getSeverityText(severity) || severity || '-'}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>Trigger start time</strong>
              <p>{getTime(start_time)}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>Trigger last updated</strong>
              <p>{getTime(last_notification_time)}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>Monitor</strong>
              <p>
                <EuiLink href={`${PLUGIN_NAME}#/monitors/${monitor_id}`}>{monitor_name}</EuiLink>
              </p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiHorizontalRule margin={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>{_.isArray(condition) ? 'Conditions' : 'Condition'}</strong>
              {loadingMonitors ? (
                'Loading conditions...'
              ) : _.isArray(condition) ? (
                condition
              ) : (
                <p>{condition}</p>
              )}
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>Time range for the last</strong>
              <p>{timeRangeForLast}</p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>Filters</strong>
              <p>{loadingMonitors ? 'Loading filters...' : filters}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size={'m'}>
              <strong>Group by</strong>
              <p>
                {loadingMonitors
                  ? 'Loading groups...'
                  : !_.isEmpty(groupBy)
                  ? _.join(_.orderBy(groupBy), ', ')
                  : '-'}
              </p>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiHorizontalRule margin={'xxl'} />

        <EuiFlexGroup>
          <EuiFlexItem>
            <Dashboard
              isAlertsFlyout={true}
              monitorIds={[monitor_id]}
              detectorIds={detectorId ? [detectorId] : []}
              httpClient={httpClient}
              location={location}
              history={history}
              notifications={notifications}
              monitorType={monitorType}
              perAlertView={true}
              groupBy={groupBy}
              flyoutAlerts={alerts}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size={'l'} />
      </div>
    ),
  };
};

export default alertsDashboard;
