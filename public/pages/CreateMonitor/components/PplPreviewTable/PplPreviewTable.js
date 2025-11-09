/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  EuiAccordion,
  EuiFlexGroup,
  EuiHorizontalRule,
  EuiInMemoryTable,
  EuiPagination,
  EuiPanel,
  EuiSpacer,
  EuiTabbedContent,
  EuiText,
  EuiCodeBlock,
  EuiFlexItem,
} from '@elastic/eui';

const isPlainObject = (v) => Object.prototype.toString.call(v) === '[object Object]';

const flattenObject = (obj, prefix = '', out = {}) => {
  if (obj == null) return out;
  Object.keys(obj).forEach((k) => {
    const key = prefix ? `${prefix}.${k}` : k;
    const val = obj[k];
    if (isPlainObject(val)) {
      flattenObject(val, key, out);
    } else if (Array.isArray(val)) {
      out[key] = JSON.stringify(val);
    } else {
      out[key] = val;
    }
  });
  return out;
};

const rowFromSchema = (schema, arrayRow) => {
  const obj = {};
  schema.forEach((col, idx) => {
    obj[col.name] = arrayRow[idx];
  });
  return obj;
};

export const pplRespToDocs = (resp) => {
  if (resp && Array.isArray(resp.schema) && Array.isArray(resp.datarows)) {
    return resp.datarows.map((row) => flattenObject(rowFromSchema(resp.schema, row)));
  }

  const hits = resp && resp.hits && resp.hits.hits;
  if (Array.isArray(hits)) {
    return hits.map((h) => {
      const meta = {
        _id: h._id,
        _index: h._index,
        _score: h._score,
        _type: h._type,
      };
      const src = isPlainObject(h._source) ? flattenObject(h._source) : {};
      return { ...meta, ...src };
    });
  }

  return [];
};

const TokenStream = ({ doc }) => {
  const entries = useMemo(() => Object.entries(doc || {}), [doc]);
  const CHIP_LINE_HEIGHT = 20;
  const CHIP_PAD_Y = 2;

  return (
    <EuiText
      size="s"
      style={{
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        lineHeight: `${(CHIP_LINE_HEIGHT + CHIP_PAD_Y * 2) / 14}`,
      }}
    >
      {entries.map(([k, v]) => {
        const value = typeof v === 'number' ? v.toLocaleString() : String(v ?? '-');
        return (
          <span key={k} style={{ display: 'inline' }}>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(8, 108, 106, .1)',
                border: '1px solid rgba(8, 108, 106, .15)',
                color: 'inherit',
                borderRadius: 8,
                padding: `${CHIP_PAD_Y}px 8px`,
                marginRight: 6,
                marginBottom: 6,
                fontWeight: 400,
                lineHeight: `${CHIP_LINE_HEIGHT}px`,
              }}
            >
              {k}:
            </span>
            <span
              style={{
                display: 'inline-block',
                marginRight: 12,
                marginBottom: 6,
                lineHeight: `${CHIP_LINE_HEIGHT}px`,
              }}
            >
              {value}
            </span>
          </span>
        );
      })}
    </EuiText>
  );
};

TokenStream.propTypes = {
  doc: PropTypes.object,
};

const ExpandedDoc = ({ doc }) => {
  const rows = useMemo(
    () =>
      Object.entries(doc || {}).map(([k, v]) => ({
        key: k,
        value: typeof v === 'number' ? v.toLocaleString() : String(v ?? '-'),
      })),
    [doc]
  );

  const table = (
    <EuiInMemoryTable
      items={rows}
      columns={[
        {
          field: 'key',
          name: 'Field',
          sortable: true,
          render: (k) => (
            <EuiText size="s" style={{ fontFamily: 'monospace' }}>
              {k}
            </EuiText>
          ),
          width: '40%',
        },
        {
          field: 'value',
          name: 'Value',
          render: (v) => <EuiText size="s">{v}</EuiText>,
        },
      ]}
      sorting
      pagination={{ pageSizeOptions: [50, 100, 200], initialPageSize: 50 }}
      data-test-subj="ppl-preview-kv-table"
    />
  );

  const json = (
    <EuiCodeBlock language="json" isCopyable paddingSize="m" fontSize="s" overflowHeight={360}>
      {JSON.stringify(doc, null, 2)}
    </EuiCodeBlock>
  );

  return (
    <EuiTabbedContent
      tabs={[
        { id: 'tab-table', name: 'Table', content: <div style={{ padding: 12 }}>{table}</div> },
        { id: 'tab-json', name: 'JSON', content: <div style={{ padding: 12 }}>{json}</div> },
      ]}
      initialSelectedTab={{ id: 'tab-table', name: 'Table' }}
      autoFocus="selected"
    />
  );
};

ExpandedDoc.propTypes = {
  doc: PropTypes.object,
};

export const PplPreviewTable = ({ docs, isLoading = false }) => {
  const list = Array.isArray(docs) ? docs : [];
  const PAGE_SIZE = 5;
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = Math.ceil(list.length / PAGE_SIZE) || 1;
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  useEffect(() => {
    setPageIndex(0);
  }, [docs]);

  useEffect(() => {
    if (pageIndex !== safePageIndex) {
      setPageIndex(safePageIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount]);

  const start = safePageIndex * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, list.length);
  const currentDocs = list.slice(start, end).map((doc, idx) => ({
    id: start + idx,
    values: doc,
  }));

  if (isLoading) {
    return <EuiText size="s">Loading preview…</EuiText>;
  }
  if (!list.length) {
    return (
      <EuiText size="s" color="subdued">
        No preview rows.
      </EuiText>
    );
  }

  return (
    <div data-test-subj="ppl-preview-container">
      {currentDocs.map((doc) => (
        <EuiPanel hasBorder paddingSize="m" key={doc.id} style={{ marginBottom: 12 }}>
          <TokenStream doc={doc.values} />
          <EuiHorizontalRule margin="s" />
          <EuiAccordion
            id={`doc-${doc.id}`}
            buttonContent={
              <EuiText size="s">
                <strong>Expanded document</strong>
              </EuiText>
            }
            paddingSize="m"
          >
            <ExpandedDoc doc={doc.values} />
          </EuiAccordion>
        </EuiPanel>
      ))}
      <EuiSpacer size="m" />
      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            {`Showing ${start + 1}-${end} of ${list.length}`}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiPagination
            pageCount={pageCount || 1}
            activePage={safePageIndex}
            onPageClick={setPageIndex}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
};

PplPreviewTable.propTypes = {
  docs: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
};
