/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';

// TODO DRAFT: Are these sortField options appropriate?
export const GET_FINDINGS_SORT_FIELDS = {
  INDEX: 'index',
  MONITOR_NAME: 'monitor_name',
  TIMESTAMP: 'timestamp',
};

// TODO DRAFT: RestGetFindingsAction.kt in the backend references a `missing` field in params.
//  Investigate if/how we should make use of that.
export const DEFAULT_GET_FINDINGS_PARAMS = {
  // TODO DRAFT: Does providing a finding ID serve a particular function? Results with/without the ID seemed the same.
  id: undefined,
  from: 0,
  search: '',
  size: 20,
  sortDirection: 'desc',
  sortField: GET_FINDINGS_SORT_FIELDS.TIMESTAMP,
};

export default class FindingService {
  constructor(esDriver) {
    this.esDriver = esDriver;
  }

  getFindings = async (context, req, res) => {
    const {
      id = DEFAULT_GET_FINDINGS_PARAMS.id,
      from = DEFAULT_GET_FINDINGS_PARAMS.from,
      size = DEFAULT_GET_FINDINGS_PARAMS.size,
      search = DEFAULT_GET_FINDINGS_PARAMS.search,
      sortDirection = DEFAULT_GET_FINDINGS_PARAMS.sortDirection,
      sortField = DEFAULT_GET_FINDINGS_PARAMS.sortField,
    } = req.query;

    var params;
    switch (sortField) {
      case GET_FINDINGS_SORT_FIELDS.INDEX:
        params = {
          sortString: `${sortField}.keyword`,
          sortOrder: sortDirection,
        };
        break;
      case GET_FINDINGS_SORT_FIELDS.MONITOR_NAME:
        params = {
          sortString: `${sortField}.keyword`,
          sortOrder: sortDirection,
        };
        break;
      default:
        // If the sortField parsed from the URL isn't a valid option for this API, use a default option.
        params = {
          sortString: GET_FINDINGS_SORT_FIELDS.TIMESTAMP,
          sortOrder: sortDirection,
        };
    }

    if (!_.isEmpty(id)) params.findingId = id;
    params.startIndex = from;
    params.size = size;
    params.searchString = search;
    if (search.trim()) params.searchString = `*${search.trim().split(' ').join('* *')}*`;

    const { callAsCurrentUser } = this.esDriver.asScoped(req);
    try {
      const resp = await callAsCurrentUser('alerting.getFindings', params);
      const findings = resp.findings.map((result) => ({ [result.finding.id]: { ...result } }));
      const totalFindings = resp.totalFindings;
      return res.ok({
        body: {
          ok: true,
          findings,
          totalFindings,
        },
      });
    } catch (err) {
      console.log(err.message);
      return res.ok({
        body: {
          ok: false,
          err: err.message,
        },
      });
    }
  };
}
