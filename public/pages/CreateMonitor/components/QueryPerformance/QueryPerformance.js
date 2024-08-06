/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import _ from 'lodash';
import {
  EuiSmallButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiLink,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { DEFAULT_EMPTY_DATA, MONITOR_TYPE } from '../../../../utils/constants';
import ContentPanel from '../../../../components/ContentPanel';

export const RECOMMENDED_DURATION = 100;
export const SEARCH_DOCUMENTATION = 'https://opensearch.org/docs/latest/search-plugins/';

const getPerformanceCallOut = () => (
  <EuiCallOut
    title={'Large queries may impact monitor and remote cluster performance'}
    color={'warning'}
    iconType={'alert'}
  >
    We recommend reducing your query size and time range or changing data sources to optimize for
    monitor performance.{' '}
    <EuiLink external href={SEARCH_DOCUMENTATION} target={'_blank'}>
      Learn more
    </EuiLink>
  </EuiCallOut>
);

export const getPerformanceModal = ({ edit, onClose, onSubmit, values }) => {
  const monitorType = _.get(
    values,
    'monitor_type',
    _.get(values, 'workflow_type', MONITOR_TYPE.QUERY_LEVEL)
  );

  let hasRemoteClusters;
  switch (monitorType) {
    case MONITOR_TYPE.CLUSTER_METRICS:
      hasRemoteClusters = !_.isEmpty(_.get(values, 'uri.clusters', []));
      break;
    default:
      // Indexes for remote clusters will store the index name in
      // the 'value' attribute of the object, not the 'label' attribute.
      hasRemoteClusters = _.get(values, 'index', [])
        .map(({ label, value }) => value || label)
        .some((indexName) => indexName.includes(':'));
  }

  return (
    <EuiModal onClose={onClose}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <EuiText size="s">
            <h2>Monitor is not optimized</h2>
          </EuiText>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiText size="s">
          <p>The following use cases may impact this monitor's performance.</p>
          <ul>
            {hasRemoteClusters && <li>One or more remote indexes may affect monitor accuracy</li>}
            <li>Large queries may impact monitor and remote cluster performance</li>
          </ul>
        </EuiText>
      </EuiModalBody>

      <EuiModalFooter>
        <EuiSmallButton fill={false} onClick={onSubmit}>
          {edit ? 'Update' : 'Create'} anyway
        </EuiSmallButton>

        <EuiSmallButton fill={true} onClick={onClose}>
          Reconfigure
        </EuiSmallButton>
      </EuiModalFooter>
    </EuiModal>
  );
};

const QueryPerformance = ({ response, actions }) => {
  const monitorDuration = _.get(response, 'took', DEFAULT_EMPTY_DATA);
  const monitorDurationCallout = monitorDuration >= RECOMMENDED_DURATION;

  // TODO: Need to confirm the purpose of requestDuration.
  //  There's no explanation for it in the frontend code even back to opendistro implementation.
  const requestDuration = _.get(response, 'invalid.path', DEFAULT_EMPTY_DATA);
  const requestDurationCallout = requestDuration >= RECOMMENDED_DURATION;
  const displayPerfCallOut = monitorDurationCallout || requestDurationCallout;
  const alertIcon = (
    <>
      &nbsp;
      <EuiIcon type={'alert'} />
    </>
  );
  return (
    <Fragment>
      {displayPerfCallOut && (
        <>
          {getPerformanceCallOut()}
          <EuiSpacer />
        </>
      )}

      <ContentPanel
        title="Monitor performance"
        titleSize="s"
        panelStyles={{ paddingLeft: '10px', paddingRight: '10px' }}
        actions={actions}
      >
        <EuiSpacer size="s" />
        <EuiFlexGroup alignItems="flexStart" gutterSize="xl">
          <EuiFlexItem grow={false}>
            <EuiText size={'xs'} color={monitorDurationCallout ? 'danger' : undefined}>
              <strong>Monitor duration</strong>
              <span style={{ display: 'block' }}>
                {`${monitorDuration} ms`}
                {monitorDurationCallout ? alertIcon : undefined}
              </span>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size={'xs'} color={requestDurationCallout ? 'danger' : undefined}>
              <strong>Request duration</strong>
              <span style={{ display: 'block' }}>
                {requestDuration}
                {requestDurationCallout ? alertIcon : undefined}
              </span>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size="xs">
              <strong>Hits</strong>
              <span style={{ display: 'block' }}>
                {_.get(response, 'hits.total.value', DEFAULT_EMPTY_DATA)}
              </span>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </ContentPanel>
    </Fragment>
  );
};

export default QueryPerformance;
