/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import {
  EuiButtonEmpty,
  EuiCodeBlock,
  EuiFlexGrid,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiLink,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import _ from 'lodash';
import { getFindings } from './utils';
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
      flyoutHeight: undefined,
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
    const { isFlyoutOpen } = this.state;
    this.setState({ isFlyoutOpen: !isFlyoutOpen });
  };

  closeFlyout = () => {
    this.setState({ isFlyoutOpen: false });
  };

  async renderFlyout() {
    const { alert, isAlertsFlyout = false } = this.props;
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
        type={isAlertsFlyout ? 'overlay' : 'push'}
        onClose={this.closeFlyout}
        ownFocus={false}
        hideCloseButton={true}
        side={'right'}
        size={'m'}
      >
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size={'m'}>
            <h2 id={findingId || `temp_finding_${docId}`}>Document finding</h2>
          </EuiTitle>
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

        <EuiFlyoutFooter>
          <EuiButtonEmpty
            iconType={'cross'}
            onClick={this.closeFlyout}
            style={{ paddingLeft: '0px', marginLeft: '0px' }}
          >
            Close
          </EuiButtonEmpty>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
    this.setState({ flyout: flyout });
  }

  render() {
    const { docList, flyout, isFlyoutOpen } = this.state;
    return (
      <div>
        <EuiLink onClick={this.onClick}>{_.get(docList, '0.id', NO_FINDING_DOC_ID_TEXT)}</EuiLink>
        {isFlyoutOpen && flyout}
      </div>
    );
  }
}
