/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  EuiPopover,
  EuiButtonEmpty,
  EuiSelectable,
  EuiSelectableOption,
  EuiText,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiEmptyPrompt,
  EuiLoadingSpinner,
} from '@elastic/eui';

interface SavedQuery {
  id: string;
  attributes: {
    title: string;
    description?: string;
    query: {
      query: string;
      language: string;
    };
  };
}

interface SavedQueriesPopoverProps {
  savedQueryService: any;
  onLoadQuery: (queryText: string) => void;
  isOpen: boolean;
  onClose: () => void;
  buttonProps?: any;
}

export const SavedQueriesPopover: React.FC<SavedQueriesPopoverProps> = ({
  savedQueryService,
  onLoadQuery,
  isOpen,
  onClose,
  buttonProps = {},
}) => {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<EuiSelectableOption[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null);

  // Fetch saved queries when popover opens
  useEffect(() => {
    if (isOpen && savedQueryService) {
      setIsLoading(true);
      savedQueryService
        .getAllSavedQueries()
        .then((queries: SavedQuery[]) => {
          // Filter to only PPL queries
          const pplQueries = queries.filter(
            (q) => q.attributes?.query?.language?.toLowerCase() === 'ppl'
          );
          setSavedQueries(pplQueries);

          // Convert to selectable options
          const opts: EuiSelectableOption[] = pplQueries.map((q) => ({
            label: q.attributes.title || 'Untitled',
            key: q.id,
            prepend: '📝',
            append: q.attributes.description ? (
              <EuiText size="xs" color="subdued">
                {q.attributes.description}
              </EuiText>
            ) : undefined,
          }));
          setOptions(opts);
          setIsLoading(false);
        })
        .catch((err: any) => {
          // eslint-disable-next-line no-console
          console.error('[SavedQueriesPopover] Error fetching saved queries:', err);
          setIsLoading(false);
        });
    }
  }, [isOpen, savedQueryService]);

  const handleSelectionChange = useCallback(
    (newOptions: EuiSelectableOption[]) => {
      const selected = newOptions.find((opt) => opt.checked === 'on');
      if (selected) {
        const query = savedQueries.find((q) => q.id === selected.key);
        setSelectedQuery(query || null);
      } else {
        setSelectedQuery(null);
      }
      setOptions(newOptions);
    },
    [savedQueries]
  );

  const handleLoadClick = useCallback(() => {
    if (selectedQuery) {
      const queryText = selectedQuery.attributes?.query?.query || '';
      onLoadQuery(queryText);
      onClose();
    }
  }, [selectedQuery, onLoadQuery, onClose]);

  const button = (
    <EuiButtonEmpty
      size="s"
      iconType={isOpen ? 'arrowUp' : 'arrowDown'}
      iconSide="right"
      {...buttonProps}
    >
      Saved queries
    </EuiButtonEmpty>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isOpen}
      closePopover={onClose}
      anchorPosition="downLeft"
      panelPaddingSize="s"
    >
      <div style={{ width: 300, maxHeight: 400 }}>
        <EuiText size="xs">
          <strong>Load a saved PPL query</strong>
        </EuiText>
        <EuiSpacer size="s" />

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <EuiLoadingSpinner size="m" />
          </div>
        ) : savedQueries.length === 0 ? (
          <EuiEmptyPrompt
            iconType="search"
            title={<h4>No saved PPL queries</h4>}
            body={
              <EuiText size="s" color="subdued">
                Save a query from Explore to see it here.
              </EuiText>
            }
            titleSize="xs"
          />
        ) : (
          <>
            <EuiSelectable
              options={options}
              onChange={handleSelectionChange}
              singleSelection={true}
              listProps={{ bordered: true }}
              height={250}
              searchable
              searchProps={{
                placeholder: 'Search saved queries...',
                compressed: true,
              }}
            >
              {(list, search) => (
                <>
                  {search}
                  <EuiSpacer size="xs" />
                  {list}
                </>
              )}
            </EuiSelectable>
            <EuiSpacer size="s" />
            <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty size="s" onClick={onClose}>
                  Cancel
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  fill
                  onClick={handleLoadClick}
                  disabled={!selectedQuery}
                  data-test-subj="loadSavedQueryButton"
                >
                  Load query
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </>
        )}
      </div>
    </EuiPopover>
  );
};


