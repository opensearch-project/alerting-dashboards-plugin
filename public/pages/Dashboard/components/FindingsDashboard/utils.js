/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { renderTime } from '../../utils/tableUtils';
import FindingFlyout from './FindingFlyout';
import QueryPopover from './QueriesPopover';

export const TABLE_TAB_IDS = {
  ALERTS: { id: 'alerts', name: 'Alerts' },
  FINDINGS: { id: 'findings', name: 'Document findings' },
};

export const findingsColumnTypes = (isAlertsFlyout) => [
  {
    field: 'document_list',
    name: 'Document',
    sortable: true,
    truncateText: true,
    render: (document_list, finding) => {
      // TODO FIXME: ExecuteMonitor API currently only returns a list of query names/IDs and the relevant docIds.
      //  As a result, the preview dashboard cannot display document contents.
      return _.isEmpty(document_list) ? (
        finding.related_doc_id
      ) : (
        <FindingFlyout
          isAlertsFlyout={isAlertsFlyout}
          finding={finding}
          document_list={document_list}
        />
      );
    },
  },
  {
    field: 'queries',
    name: 'Query',
    sortable: true,
    truncateText: false,
    render: (queries) => {
      if (_.isEmpty(queries))
        console.log('Findings index contains an entry with 0 queries:', queries);
      return queries.length > 1 ? (
        <QueryPopover queries={queries} />
      ) : (
        `${queries[0].name} (${queries[0].query})`
      );
    },
  },
  {
    field: 'timestamp',
    name: 'Time found',
    sortable: true,
    truncateText: false,
    render: renderTime,
    dataType: 'date',
  },
];

export const getFindingsForMonitor = (findings, monitorId) => {
  const monitorFindings = [];
  findings.map((finding) => {
    const findingId = _.keys(finding)[0];
    const findingValues = _.get(finding, `${findingId}.finding`);
    const findingMonitorId = findingValues.monitor_id;
    if (!_.isEmpty(findingValues) && findingMonitorId === monitorId)
      monitorFindings.push({ ...findingValues, document_list: finding[findingId].document_list });
  });
  return { findings: monitorFindings, totalFindings: monitorFindings.length };
};

export const parseFindingsForPreview = (previewResponse, index, queries = []) => {
  // TODO FIXME: ExecuteMonitor API currently only returns a list of query names/IDs and the relevant docIds.
  //  As a result, the preview dashboard cannot display document contents.
  const timestamp = Date.now();
  const findings = [];
  const docIdsToQueries = {};

  _.keys(previewResponse).forEach((queryName) => {
    _.get(previewResponse, queryName, []).forEach((id) => {
      if (_.includes(_.keys(docIdsToQueries), id)) {
        const query = _.find(queries, { queryName: queryName });
        docIdsToQueries[id].push({ name: queryName, query: query.query });
      } else {
        const query = _.find(queries, { queryName: queryName });
        docIdsToQueries[id] = [{ name: queryName, query: query.query }];
      }
    });
  });

  _.keys(docIdsToQueries).forEach((docId) => {
    const finding = {
      index: index,
      related_doc_id: docId,
      queries: docIdsToQueries[docId],
      timestamp: timestamp,
    };
    findings.push(finding);
  });
  return findings;
};

export const getPreviewResponseDocIds = (response) => {
  const docIds = [];
  _.keys(response).map((queryId) => {
    const docIdsList = _.get(response, queryId, []);
    docIdsList.forEach((docId) => {
      if (!_.includes(docIds, docId)) docIds.push(docId);
    });
  });
  return docIds;
};
