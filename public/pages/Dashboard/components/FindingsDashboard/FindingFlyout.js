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

export const NO_FINDING_DOC_ID_TEXT = 'No document ID';

export default class FindingFlyout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFlyoutOpen: false,
    };
  }

  componentDidMount() {
    this.renderFlyout();
  }

  onClick = () => {
    const { isFlyoutOpen } = this.state;
    this.setState({ isFlyoutOpen: !isFlyoutOpen });
  };

  closeFlyout = () => {
    this.setState({ isFlyoutOpen: false });
  };

  renderFlyout() {
    const {
      isAlertsFlyout = false,
      document_list = [],
      finding: { id: findingId = '', queries = [] },
    } = this.props;
    const { id: docId = '', index = '', document = '' } = document_list[0];
    const documentDisplay = JSON.parse(document);
    const queriesDisplay = queries.map((query, index) => {
      return (
        <p key={`${query.name}${index}`} style={{ paddingTop: index > 0 ? '10px' : undefined }}>
          {`${query.name} (${query.query})`}
        </p>
      );
    });

    return (
      <EuiFlyout
        type={isAlertsFlyout ? 'overlay' : 'push'}
        onClose={this.closeFlyout}
        ownFocus={false}
        hideCloseButton={true}
        side={isAlertsFlyout ? 'left' : 'right'}
        size={'s'}
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
          >
            {JSON.stringify(documentDisplay, null, 3)}
          </EuiCodeBlock>
        </EuiFlyoutBody>

        <EuiFlyoutFooter>
          <EuiButtonEmpty onClick={this.closeFlyout}>Close</EuiButtonEmpty>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }

  render() {
    const { document_list } = this.props;
    const { isFlyoutOpen } = this.state;
    return (
      <div>
        <EuiLink onClick={this.onClick}>
          {_.get(document_list, '0.id', NO_FINDING_DOC_ID_TEXT)}
        </EuiLink>
        {isFlyoutOpen && this.renderFlyout()}
      </div>
    );
  }
}
