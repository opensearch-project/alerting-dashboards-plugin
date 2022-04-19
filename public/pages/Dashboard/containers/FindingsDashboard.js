/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import queryString from 'query-string';
import { EuiBasicTable } from '@elastic/eui';
import ContentPanel from '../../../components/ContentPanel';
import { backendErrorNotification } from '../../../utils/helpers';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../../Monitors/containers/Monitors/utils/constants';
import {
  DEFAULT_GET_FINDINGS_PARAMS,
  GET_FINDINGS_SORT_FIELDS,
} from '../../../../server/services/FindingService';
import {
  findingsColumnTypes,
  getFindingsForMonitor,
  parseFindingsForPreview,
} from '../components/FindingsDashboard/utils';

export const GET_FINDINGS_PREVIEW_PARAMS = {
  id: DEFAULT_GET_FINDINGS_PARAMS.id,
  from: DEFAULT_GET_FINDINGS_PARAMS.from,
  search: DEFAULT_GET_FINDINGS_PARAMS.search,
  size: 10,
  sortDirection: DEFAULT_GET_FINDINGS_PARAMS.sortDirection,
  sortField: GET_FINDINGS_SORT_FIELDS.TIMESTAMP,
};

export default class FindingsDashboard extends Component {
  constructor(props) {
    super(props);

    const { isPreview = false } = props;
    const { id, from, size, search, sortField, sortDirection } = isPreview
      ? GET_FINDINGS_PREVIEW_PARAMS
      : this.getURLQueryParams();

    this.state = {
      loadingFindings: true,
      findings: [],
      totalFindings: 0,
      page: Math.floor(from / size),
      id,
      from,
      size,
      search,
      sortField,
      sortDirection,
    };
  }

  componentDidMount() {
    const { isPreview = false } = this.props;
    if (isPreview) {
      this.getPreviewFindingsDocuments();
    } else {
      const { id, from, size, search, sortField, sortDirection } = this.state;
      this.getFindings(id, from, size, search, sortDirection, sortField);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const prevQuery = this.getQueryObjectFromState(prevState);
    const currQuery = this.getQueryObjectFromState(this.state);
    if (!_.isEqual(prevQuery, currQuery)) this.componentDidMount();
  }

  getURLQueryParams() {
    const { location } = this.props;
    const {
      id = DEFAULT_GET_FINDINGS_PARAMS.id,
      from = DEFAULT_GET_FINDINGS_PARAMS.from,
      size = DEFAULT_GET_FINDINGS_PARAMS.size,
      search = DEFAULT_GET_FINDINGS_PARAMS.search,
      sortField = DEFAULT_GET_FINDINGS_PARAMS.sortField,
      sortDirection = DEFAULT_GET_FINDINGS_PARAMS.sortDirection,
    } = queryString.parse(location.search);
    return {
      id,
      from: isNaN(parseInt(from, 10)) ? DEFAULT_GET_FINDINGS_PARAMS.from : parseInt(from, 10),
      size: isNaN(parseInt(size, 10)) ? DEFAULT_GET_FINDINGS_PARAMS.size : parseInt(size, 10),
      search,
      sortField: _.includes(_.values(GET_FINDINGS_SORT_FIELDS), sortField)
        ? sortField
        : DEFAULT_GET_FINDINGS_PARAMS.sortField,
      sortDirection,
    };
  }

  getQueryObjectFromState({ id, from, size, search, sortField, sortDirection }) {
    return { id, from, size, search, sortField, sortDirection };
  }

  getFindings = _.debounce(
    (id, from, size, search, sortDirection, sortField) => {
      this.setState({ loadingFindings: true });
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
      const { httpClient, history, monitorId, notifications } = this.props;
      history.replace({ ...this.props.location, search: queryParamsString });

      httpClient.get('../api/alerting/findings/_search', { query: params }).then((resp) => {
        if (resp.ok) {
          this.setState({ ...getFindingsForMonitor(resp.findings, monitorId) });
        } else {
          console.log('Error getting findings:', resp);
          backendErrorNotification(notifications, 'get', 'findings', resp.err);
        }
      });
      this.setState({ loadingFindings: false });
    },
    500,
    { leading: true }
  );

  getPreviewFindingsDocuments() {
    this.setState({ loadingFindings: true });
    const { index, queries, previewResponse } = this.props;
    this.setState({
      loadingFindings: false,
      findings: parseFindingsForPreview(previewResponse, index, queries),
    });
  }

  onTableChange = ({ page: tablePage = {}, sort = {} }) => {
    const { index: page, size } = tablePage;
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({ page, size, sortField, sortDirection });
  };

  render() {
    const { isAlertsFlyout = false, isPreview = false } = this.props;
    const {
      loadingFindings,
      findings,
      totalFindings,
      size,
      sortField,
      sortDirection,
      page,
    } = this.state;

    const pagination = {
      pageIndex: page,
      pageSize: size,
      totalItemCount: Math.min(size, totalFindings),
      pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS,
    };

    const sorting = {
      sort: {
        direction: sortDirection,
        field: sortField,
      },
    };

    const getItemId = (item) => item.id;

    return (
      <ContentPanel
        title={'Document findings'}
        description={
          isPreview
            ? `Showing first ${GET_FINDINGS_PREVIEW_PARAMS.size} document findings.`
            : undefined
        }
        titleSize={'s'}
        bodyStyles={{ padding: 'initial' }}
      >
        <EuiBasicTable
          items={findings}
          itemId={getItemId}
          columns={findingsColumnTypes(isAlertsFlyout)}
          pagination={isPreview ? undefined : pagination}
          sorting={sorting}
          isSelectable={false}
          onChange={this.onTableChange}
          loading={loadingFindings}
          noItemsMessage={loadingFindings ? 'Loading findings...' : 'No findings found.'}
        />
      </ContentPanel>
    );
  }
}
