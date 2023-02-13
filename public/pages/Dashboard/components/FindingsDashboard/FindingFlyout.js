/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import {
  EuiCodeBlock,
  EuiFlexGrid,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiLink,
  EuiText,
  EuiTitle,
  EuiFlexGroup,
  EuiButtonIcon,
} from '@elastic/eui';
import { getFindings } from './findingsUtils';
import { DEFAULT_GET_FINDINGS_PARAMS } from '../../../../../server/services/FindingService';

export const NO_FINDING_DOC_ID_TEXT = 'No document ID';

export default class FindingFlyout extends Component {
  constructor(props) {
    super(props);
    const { alert, document_list = [], finding = {} } = props;
    const alertDocList = _.isEmpty(alert) ? undefined : [{ id: _.get(alert, 'related_doc_ids.0') }];
    this.state = {
      docList: alertDocList || document_list,
      flyout: undefined,
      finding: finding,
      isFlyoutOpen: false,
    };
  }

  async componentDidUpdate(prevProps, prevState) {
    const { isFlyoutOpen } = this.state;
    if (prevState.isFlyoutOpen !== isFlyoutOpen && isFlyoutOpen) await this.renderFlyout();
  }

  async getFinding() {
    const { alert, httpClient, history, location, notifications } = this.props;
    const findingId = _.get(alert, 'finding_ids.0', '');
    const findingResults = await getFindings({
      ...DEFAULT_GET_FINDINGS_PARAMS,
      id: findingId,
      httpClient,
      history,
      monitorId: alert.monitor_id,
      location,
      notifications,
    });
    const finding = findingResults.findings[0];
    this.setState({ finding: finding, docList: finding.document_list });
  }

  onClick = () => {
    const { dashboardFlyoutIsOpen = false, openFlyout, closeFlyout } = this.props;
    const { isFlyoutOpen } = this.state;
    if (typeof openFlyout === 'function' && typeof closeFlyout === 'function') {
      if (dashboardFlyoutIsOpen) closeFlyout();
      else openFlyout();
    }
    this.setState({ isFlyoutOpen: !isFlyoutOpen });
  };

  closeFlyout = () => {
    this.setState({ isFlyoutOpen: false });

    const { dashboardFlyoutIsOpen = false, closeFlyout } = this.props;

    if (typeof closeFlyout === 'function' && dashboardFlyoutIsOpen) {
      closeFlyout();
    }
  };

  async renderFlyout() {
    const { alert } = this.props;
    if (!_.isEmpty(alert)) await this.getFinding();

    const { docList, finding } = this.state;
    const { id: findingId = '', queries = [] } = finding;
    const { id: docId = '', index = '', document = '' } = docList[0];
    const documentDisplay = JSON.parse(document);
    const queriesDisplay = queries.map((query, indexNum) => {
      return (
        <p
          key={`${query.name}${indexNum}`}
          style={{ paddingTop: indexNum > 0 ? '10px' : undefined }}
        >
          {`${query.name} (${query.query})`}
        </p>
      );
    });

    const flyout = (
      <EuiFlyout
        onClose={this.closeFlyout}
        ownFocus={true}
        hideCloseButton={true}
        side={'right'}
        size={'m'}
      >
        <EuiFlyoutHeader hasBorder>
          <EuiFlexGroup justifyContent="flexStart" alignItems="center">
            <EuiFlexItem className="eui-textTruncate">
              <EuiTitle size={'m'} className="eui-textTruncate">
                <h3 id={findingId || `temp_finding_${docId}`}>Document finding</h3>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="cross"
                display="empty"
                iconSize="m"
                onClick={this.closeFlyout}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutHeader>

        <EuiFlyoutBody>
          <EuiFlexGrid columns={2} direction={'column'} gutterSize={'m'}>
            <EuiFlexItem grow={false}>
              <EuiText size={'m'}>
                <strong>Document ID</strong>
                <p>{docId}</p>
              </EuiText>
            </EuiFlexItem>

            {/*TODO FIXME: ExecuteMonitor API currently only returns a list of query names/IDs and the relevant docIds */}
            {!_.isEmpty(findingId) && (
              <EuiFlexItem grow={false}>
                <EuiText size={'m'}>
                  <strong>Finding ID</strong>
                  <p>{findingId}</p>
                </EuiText>
              </EuiFlexItem>
            )}

            <EuiFlexItem grow={false}>
              <EuiText size={'m'}>
                <strong>Index</strong>
                <p>{index}</p>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGrid>

          <EuiHorizontalRule margin={'l'} />

          <EuiText size={'m'}>
            <strong>Queries</strong>
            {queriesDisplay}
          </EuiText>

          <EuiHorizontalRule margin={'l'} />

          <EuiText size={'m'}>
            <strong>Document</strong>
          </EuiText>
          <EuiCodeBlock
            language={'json'}
            fontSize={'m'}
            paddingSize={'m'}
            overflowHeight={600}
            inline={false}
            isCopyable
            style={{ height: '400px' }}
          >
            {JSON.stringify(documentDisplay, null, 3)}
          </EuiCodeBlock>
        </EuiFlyoutBody>
      </EuiFlyout>
    );
    this.setState({ flyout: flyout });
  }

  render() {
    const { dashboardFlyoutIsOpen } = this.props;
    const { docList, flyout, isFlyoutOpen } = this.state;
    const openFlyout = _.isUndefined(dashboardFlyoutIsOpen)
      ? isFlyoutOpen
      : dashboardFlyoutIsOpen && isFlyoutOpen;
    let docId = _.get(docList, '0.id', NO_FINDING_DOC_ID_TEXT);
    docId = _.split(docId, '|')[0];
    return (
      <div>
        <EuiLink onClick={this.onClick}>{docId}</EuiLink>
        {openFlyout && flyout}
      </div>
    );
  }
}
