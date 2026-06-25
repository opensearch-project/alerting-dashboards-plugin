/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiAccordion,
  EuiCodeBlock,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIconTip,
  EuiPanel,
  EuiSmallButton,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { QueryEditor } from '../../pages/CreateMonitor/components/QueryEditor';
import { AlertingDataTable } from '../DataTable';

const PplQueryEditor = ({
  pplQuery,
  onQueryChange,
  previewResult,
  previewError,
  previewLoading,
  previewOpen,
  onPreviewToggle,
  onRunPreview,
  editorHeight = 220,
  autoExpand = false,
  services,
  indices,
  maxLength = 10000,
  wrapperStyle,
}) => (
  <div style={wrapperStyle}>
    <EuiFlexGroup
      alignItems="center"
      justifyContent="spaceBetween"
      gutterSize="s"
      responsive={false}
    >
      <EuiFlexItem grow={false}>
        <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiText>PPL</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiIconTip
              type="iInCircle"
              content="Write queries in PPL."
              position="left"
              iconProps={{ style: { border: 'none', background: 'none' } }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiSmallButton
          onClick={onRunPreview}
          isLoading={previewLoading}
          data-test-subj="runPreview"
        >
          Run preview
        </EuiSmallButton>
      </EuiFlexItem>
    </EuiFlexGroup>

    <EuiSpacer size="s" />

    <div data-test-subj="pplEditorMonaco">
      <QueryEditor
        value={pplQuery}
        onChange={(text) => {
          if (text.length <= maxLength) onQueryChange(text);
        }}
        services={services}
        height={editorHeight}
        indices={indices}
        autoExpand={autoExpand}
      />
      {pplQuery && (
        <EuiText size="xs" color="subdued" style={{ marginTop: '4px' }}>
          {pplQuery.length} / {maxLength.toLocaleString()} characters
        </EuiText>
      )}
    </div>

    <EuiSpacer size="m" />

    <EuiAccordion
      id="pplPreviewAccordion"
      buttonContent="Preview results"
      paddingSize="m"
      data-test-subj="pplPreviewAccordion"
      forceState={previewOpen ? 'open' : 'closed'}
      onToggle={onPreviewToggle}
    >
      <EuiPanel hasBorder paddingSize="l" data-test-subj="pplResultsPanel">
        <EuiTitle size="s">
          <h2>Results</h2>
        </EuiTitle>
        <EuiHorizontalRule margin="m" />
        {!previewResult && !previewError ? (
          <EuiEmptyPrompt
            iconType="editorCodeBlock"
            title={<h3>Run a query to view results</h3>}
            layout="vertical"
          />
        ) : previewError ? (
          <EuiCodeBlock isCopyable>{previewError}</EuiCodeBlock>
        ) : (
          <AlertingDataTable
            pplResponse={previewResult}
            isLoading={previewLoading}
            services={services}
          />
        )}
      </EuiPanel>
    </EuiAccordion>
  </div>
);

export default PplQueryEditor;
