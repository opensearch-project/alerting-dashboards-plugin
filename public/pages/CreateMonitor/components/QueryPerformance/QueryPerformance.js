/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import _ from 'lodash';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiSpacer, EuiText } from '@elastic/eui';

import { DEFAULT_EMPTY_DATA } from '../../../../utils/constants';
import { URL } from '../../../../../utils/constants';
import ContentPanel from '../../../../components/ContentPanel';

const QueryPerformance = ({ response, actions }) => (
  <Fragment>
    <ContentPanel
      title="Query performance"
      titleSize="s"
      panelStyles={{ paddingLeft: '10px', paddingRight: '10px' }}
      description={
        <span>
          Check the performance of your query and make sure to follow best practices.{' '}
          <EuiLink external href={URL.DOCUMENTATION} target="_blank">
            Learn more
          </EuiLink>
        </span>
      }
      actions={actions}
    >
      <EuiSpacer size="s" />
      <EuiFlexGroup alignItems="flexStart" gutterSize="xl">
        <EuiFlexItem grow={false}>
          <EuiText size="xs">
            <strong>Query duration</strong>
            <span style={{ display: 'block' }}>
              {`${_.get(response, 'took', DEFAULT_EMPTY_DATA)} ms`}
            </span>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs">
            <strong>Request duration</strong>
            <span style={{ display: 'block' }}>
              {_.get(response, 'invalid.path', DEFAULT_EMPTY_DATA)}
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

export default QueryPerformance;
