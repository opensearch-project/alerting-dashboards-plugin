/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './AlertingDataTable.scss';
import React, { useState, useMemo } from 'react';
import {
  EuiSmallButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiCodeBlock,
  EuiTabbedContent,
  EuiText,
  EuiInMemoryTable,
  EuiPagination,
  EuiCallOut,
  EuiSmallButtonEmpty,
  EuiTextColor,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';
import dompurify from 'dompurify';

interface AlertingDataTableProps {
  pplResponse: any;
  isLoading?: boolean;
  services: any;
}

const PAGINATED_PAGE_SIZE = 5;

/**
 * Flatten nested objects recursively (like Discover does)
 */
const flattenObject = (obj: any, prefix = '', out: Record<string, any> = {}): Record<string, any> => {
  if (obj == null) return out;
  
  Object.keys(obj).forEach((k) => {
    const key = prefix ? `${prefix}.${k}` : k;
    const val = obj[k];
    
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Recursively flatten nested objects
      flattenObject(val, key, out);
    } else if (Array.isArray(val)) {
      // Handle arrays - show as comma-separated values
      out[key] = val.map(v => 
        typeof v === 'object' ? JSON.stringify(v) : String(v)
      ).join(', ');
    } else {
      // Handle primitives
      out[key] = val;
    }
  });
  
  return out;
};

/**
 * Convert PPL response to flattened documents
 */
const pplResponseToDocs = (pplResponse: any) => {
  if (!pplResponse || !Array.isArray(pplResponse.schema) || !Array.isArray(pplResponse.datarows)) {
    return [];
  }

  const { schema, datarows } = pplResponse;
  
  return datarows.map((row, index) => {
    const doc: Record<string, any> = {};
    schema.forEach((col: any, idx: number) => {
      doc[col.name] = row[idx];
    });
    
    // Flatten the document like Discover does
    const flattened = flattenObject(doc);
    return { _id: `${index}`, ...flattened };
  });
};

/**
 * Stream Preview Row - Shows compact log entry like Discover
 */
const StreamPreviewRow: React.FC<{
  doc: Record<string, any>;
  columns: string[];
  index: number;
}> = ({ doc, columns, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create a compact preview string like Discover's stream view with highlighted field names
  const previewEntries = Object.entries(doc).filter(([k]) => k !== '_id');

  const previewText = previewEntries
    .map(([k, v]) => {
      if (v === null || v === undefined) return '';
      const value = typeof v === 'number' ? v.toLocaleString() : String(v);
      return (
        <span key={k}>
          <span className="field-name-highlight">{k}</span>:{value}
        </span>
      );
    })
    .filter(Boolean);

  const expandedContent = () => {
    // Sort fields to match Discover's order (put _id, _index, _score, _type at the end)
    const sortedEntries = previewEntries
      .sort(([a], [b]) => {
        const metaFields = ['_id', '_index', '_score', '_type'];
        const aIsMeta = metaFields.includes(a);
        const bIsMeta = metaFields.includes(b);
        
        if (aIsMeta && !bIsMeta) return 1;
        if (!aIsMeta && bIsMeta) return -1;
        return a.localeCompare(b);
      });

    const rows = sortedEntries.map(([k, v]) => {
      const value = typeof v === 'number' ? v.toLocaleString() : String(v ?? '-');
      const isNumeric = typeof v === 'number';
      const isTimeField = k.includes('time') || k.includes('date') || k.includes('timestamp') || k.includes('@timestamp');
      const isIdField = k.includes('_id') || k.includes('id');
      const isIndexField = k.includes('_index') || k.includes('index');
      const isScoreField = k.includes('_score') || k.includes('score');
      
      // Determine prefix based on field type (matching Discover's logic)
      let prefix = 't'; // default text
      if (isNumeric) prefix = '#';
      else if (isTimeField) prefix = 't';
      else if (isIdField) prefix = 't';
      else if (isIndexField) prefix = 't';
      else if (isScoreField) prefix = '#';
      
      return {
        key: k,
        value,
        isNumeric,
        isTimeField,
        prefix,
      };
    });

    const table = (
      <div className="expanded-document-table">
        <table className="table table-sm">
          <tbody>
            {rows.map(({ key, value, prefix }) => (
              <tr key={key}>
                <td className="field-name" style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '12px',
                  fontWeight: 'normal',
                  color: '#333',
                  width: '40%',
                  padding: '4px 8px',
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  {prefix} {key}
                </td>
                <td style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    const json = (
      <EuiCodeBlock
        language="json"
        isCopyable
        paddingSize="m"
        fontSize="s"
        overflowHeight={360}
      >
        {JSON.stringify(doc, null, 2)}
      </EuiCodeBlock>
    );

    return (
      <EuiTabbedContent
        tabs={[
          { id: 'tab-table', name: 'Table', content: <div style={{ padding: 12 }}>{table}</div> },
          { id: 'tab-json', name: 'JSON', content: <div style={{ padding: 12 }}>{json}</div> },
        ]}
        initialSelectedTab={{ id: 'tab-table' }}
        autoFocus="selected"
      />
    );
  };

  return (
    <>
      <tr key={doc._id} className="exploreDocTableRow">
        <td className="exploreDocTableCell__toggleDetails">
          <EuiSmallButtonIcon
            color="text"
            onClick={() => setIsExpanded(!isExpanded)}
            iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
            aria-label="Toggle row details"
            data-test-subj="docTableExpandToggleColumn"
          />
        </td>
        <td 
          colSpan={1}
          className="exploreDocTableCell eui-textBreakAll eui-textBreakWord"
          style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px',
            padding: '8px',
            lineHeight: '1.4'
          }}
        >
          <div className="truncate-by-height">
            <span className="exploreDocTableCell__dataField">
              {previewText.map((item, idx) => (
                <React.Fragment key={idx}>
                  {item}
                  {idx < previewText.length - 1 && ' '}
                </React.Fragment>
              ))}
            </span>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr key={'x' + doc._id}>
          <td
            className="exploreDocTable__detailsParent"
            colSpan={2}
            data-test-subj="osdDocTableDetailsParent"
          >
            <EuiFlexGroup gutterSize="m" alignItems="center">
              <EuiFlexItem grow={false}>
                <EuiIcon type="folderOpen" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <h4 className="euiTitle euiTitle--xxsmall">
                  {i18n.translate('alerting.dataTable.expandedRow.documentHeading', {
                    defaultMessage: 'Expanded document',
                  })}
                </h4>
              </EuiFlexItem>
            </EuiFlexGroup>
            {expandedContent()}
          </td>
        </tr>
      )}
    </>
  );
};

/**
 * Pagination Component
 */
const Pagination: React.FC<{
  pageCount: number;
  activePage: number;
  goToPage: (page: number) => void;
  startItem: number;
  endItem: number;
  totalItems: number;
  sampleSize: number;
}> = ({ pageCount, activePage, goToPage, startItem, endItem, totalItems, sampleSize }) => {
  return (
    <EuiFlexGroup
      className="exploreDocTable_pagination"
      alignItems="center"
      justifyContent="flexEnd"
      data-test-subj="osdDocTablePagination"
    >
      {endItem >= sampleSize && (
        <EuiFlexItem grow={false}>
          <EuiTextColor color="subdued">
            <FormattedMessage
              id="alerting.docTable.limitedSearchResultLabel"
              defaultMessage="Limited to {sampleSize} results. Refine your search."
              values={{ sampleSize }}
            />
          </EuiTextColor>
        </EuiFlexItem>
      )}
      <EuiFlexItem grow={false}>
        <FormattedMessage
          id="alerting.docTable.pagerControl.pagesCountLabel"
          defaultMessage="{startItem}&ndash;{endItem} of {totalItems}"
          values={{
            startItem,
            endItem,
            totalItems,
          }}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiPagination
          pageCount={pageCount}
          activePage={activePage}
          onPageClick={(currentPage) => goToPage(currentPage)}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/**
 * Main AlertingDataTable Component
 */
export const AlertingDataTable: React.FC<AlertingDataTableProps> = ({
  pplResponse,
  isLoading = false,
}) => {
  const docs = useMemo(() => pplResponseToDocs(pplResponse), [pplResponse]);
  const columns = useMemo(() => {
    // Since we're flattening objects, we don't need specific columns
    // The StreamPreviewRow will use all flattened fields
    return ['_source'];
  }, []);

  const [activePage, setActivePage] = useState(0);
  const pageCount = Math.ceil(docs.length / PAGINATED_PAGE_SIZE);
  
  const displayedDocs = useMemo(() => {
    const start = activePage * PAGINATED_PAGE_SIZE;
    const end = Math.min(docs.length, start + PAGINATED_PAGE_SIZE);
    return docs.slice(start, end);
  }, [docs, activePage]);

  const currentRowCounts = useMemo(() => {
    const startRow = activePage * PAGINATED_PAGE_SIZE;
    const endRow = Math.min(docs.length, startRow + PAGINATED_PAGE_SIZE);
    return { startRow, endRow };
  }, [docs.length, activePage]);

  const goToPage = (pageNumber: number) => {
    setActivePage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return <EuiText size="s">Loading preview…</EuiText>;
  }

  if (docs.length === 0) {
    return <EuiText size="s" color="subdued">No preview rows.</EuiText>;
  }

  if (columns.length === 0) {
    return <EuiText size="s" color="warning">Unable to parse PPL response schema.</EuiText>;
  }

  const showPagination = docs.length > PAGINATED_PAGE_SIZE;

  return (
    <div className="explore-table-container" data-test-subj="alerting-data-table">
      {showPagination && (
        <Pagination
          pageCount={pageCount}
          activePage={activePage}
          goToPage={goToPage}
          startItem={currentRowCounts.startRow + 1}
          endItem={currentRowCounts.endRow}
          totalItems={docs.length}
          sampleSize={docs.length}
        />
      )}
      <table data-test-subj="docTable" className="explore-table table">
        <thead>
          <tr data-test-subj="docTableHeader" className="exploreDocTableHeader">
            <th style={{ width: '28px' }} />
            <th 
              data-test-subj="docTableHeaderField"
              className="exploreDocTableHeaderField"
              role="columnheader"
            >
              <span className="header-text">_source</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {displayedDocs.map((doc, index) => (
            <StreamPreviewRow key={doc._id} doc={doc} columns={columns} index={index} />
          ))}
        </tbody>
      </table>
      {showPagination && (
        <Pagination
          pageCount={pageCount}
          activePage={activePage}
          goToPage={goToPage}
          startItem={currentRowCounts.startRow + 1}
          endItem={currentRowCounts.endRow}
          totalItems={docs.length}
          sampleSize={docs.length}
        />
      )}
    </div>
  );
};
