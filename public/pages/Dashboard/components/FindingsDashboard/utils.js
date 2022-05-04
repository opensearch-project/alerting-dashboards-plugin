/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import { renderTime } from '../../utils/tableUtils';
import FindingFlyout from './FindingFlyout';
import FindingsPopover from './FindingsPopover';
import queryString from 'query-string';
import { backendErrorNotification } from '../../../../utils/helpers';
import { MAX_FINDINGS_COUNT } from '../../containers/FindingsDashboard';

export const QUERY_OPERATORS = [
  { text: 'is', value: '==' },
  { text: 'is not', value: '!=' },
];

export const TABLE_TAB_IDS = {
  ALERTS: { id: 'alerts', name: 'Alerts' },
  FINDINGS: { id: 'findings', name: 'Document findings' },
};

export const ALERTS_FINDING_COLUMN = {
  field: 'related_doc_ids',
  name: 'Document',
  sortable: true,
  truncateText: true,
  render: (related_doc_ids, alert) => {
    if (_.isEmpty(related_doc_ids))
      console.log('Alerts index contains an entry with 0 related document IDs:', alert);
    return related_doc_ids.length > 1 ? (
      <FindingsPopover docIds={related_doc_ids} />
    ) : (
      related_doc_ids[0]
    );
  },
};

export const getAlertsFindingColumn = (
  httpClient,
  history,
  isAlertsFlyout = false,
  location,
  notifications
) => {
  return {
    field: 'related_doc_ids',
    name: 'Document',
    sortable: true,
    truncateText: true,
    render: (related_doc_ids, alert) => {
      if (_.isEmpty(related_doc_ids))
        console.log('Alerts index contains an entry with 0 related document IDs:', alert);
      return (
        <FindingFlyout
          isAlertsFlyout={isAlertsFlyout}
          alert={alert}
          httpClient={httpClient}
          history={history}
          location={location}
          notifications={notifications}
        />
      );
    },
  };
};

export const findingsColumnTypes = (isAlertsFlyout = false) => [
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
    render: (queries, finding) => {
      if (_.isEmpty(queries))
        console.log('Findings index contains an entry with 0 queries:', finding);
      return queries.length > 1 ? (
        <FindingsPopover queries={queries} />
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
  const findings = [];
  if (validDocLevelGraphQueries(queries)) {
    const queryNames = queries.map((query) => query.queryName);
    const timestamp = Date.now();
    const docIdsToQueries = {};
    _.keys(previewResponse).forEach((queryName) => {
      if (_.includes(queryNames, queryName)) {
        _.get(previewResponse, queryName, []).forEach((id) => {
          if (_.includes(_.keys(docIdsToQueries), id)) {
            const query = _.find(queries, { queryName: queryName });
            docIdsToQueries[id].push({ name: queryName, query: query.query });
          } else {
            const query = _.find(queries, { queryName: queryName });
            const operator = _.find(QUERY_OPERATORS, { value: query.operator }).text;
            const querySource = `${query.field} ${operator} ${query.query}`;
            docIdsToQueries[id] = [{ name: queryName, query: querySource }];
          }
        });
      }
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
  }
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

export const validDocLevelGraphQueries = (queries) => {
  // The 'queryName' and 'query' fields are required to execute a doc level query.
  // If either are undefined for any queries, the monitor cannot be executed.
  const allQueriesDefined = queries.find(
    (query) => !_.isEmpty(query.queryName) && !_.isEmpty(query.query)
  );
  return !_.isEmpty(allQueriesDefined);
};

export async function getFindings({
  id,
  from,
  size,
  search,
  sortField,
  sortDirection,
  httpClient,
  history,
  location,
  monitorId,
  notifications,
}) {
  const params = {
    id,
    from,
    size,
    search,
    sortDirection,
    sortField,
  };
  const queryParamsString = queryString.stringify(params);
  location.search;
  history.replace({ ...location, search: queryParamsString });

  // TODO FIXME: Refactor 'size' logic to return all findings for a monitor
  //  once the backend supports retrieving findings for a monitorId.
  params['size'] = Math.max(size, MAX_FINDINGS_COUNT);

  const resp = await httpClient.get('../api/alerting/findings/_search', { query: params });
  if (resp.ok) {
    return getFindingsForMonitor(resp.findings, monitorId);
  } else {
    console.log('Error getting findings:', resp);
    backendErrorNotification(notifications, 'get', 'findings', resp.err);
  }
}
