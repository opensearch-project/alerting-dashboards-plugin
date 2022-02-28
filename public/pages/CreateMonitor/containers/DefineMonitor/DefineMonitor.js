/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React, { Component, Fragment } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { EuiSpacer, EuiButton, EuiCallOut, EuiAccordion } from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel';
import VisualGraph from '../../components/VisualGraph';
import ExtractionQuery from '../../components/ExtractionQuery';
import MonitorExpressions from '../../components/MonitorExpressions';
import QueryPerformance from '../../components/QueryPerformance';
import { formikToMonitor } from '../CreateMonitor/utils/formikToMonitor';
import { getPathsPerDataType } from './utils/mappings';
import { buildSearchRequest } from './utils/searchRequests';
import { SEARCH_TYPE, OS_AD_PLUGIN, MONITOR_TYPE } from '../../../../utils/constants';
import { backendErrorNotification } from '../../../../utils/helpers';
import DataSource from '../DataSource';
import {
  buildClusterMetricsRequest,
  getApiType,
  getApiTypesRequiringPathParams,
} from '../../components/ClusterMetricsMonitor/utils/clusterMetricsMonitorHelpers';
import ClusterMetricsMonitor from '../../components/ClusterMetricsMonitor';
import { FORMIK_INITIAL_VALUES } from '../CreateMonitor/utils/constants';
import { API_TYPES } from '../../components/ClusterMetricsMonitor/utils/clusterMetricsMonitorConstants';

function renderEmptyMessage(message) {
  return (
    <div style={{ padding: '20px', border: '1px solid #D9D9D9', borderRadius: '5px' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '450px' }}
      >
        <div>{message}</div>
      </div>
    </div>
  );
}

const propTypes = {
  values: PropTypes.object.isRequired,
  httpClient: PropTypes.object.isRequired,
  errors: PropTypes.object,
  touched: PropTypes.object,
  detectorId: PropTypes.object,
  notifications: PropTypes.object.isRequired,
};
const defaultProps = {
  errors: {},
};

class DefineMonitor extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dataTypes: {},
      performanceResponse: null,
      response: null,
      formikSnapshot: this.props.values,
      plugins: [],
      loadingResponse: false,
    };

    this.renderGraph = this.renderGraph.bind(this);
    this.onRunQuery = this.onRunQuery.bind(this);
    this.resetResponse = this.resetResponse.bind(this);
    this.onQueryMappings = this.onQueryMappings.bind(this);
    this.queryMappings = this.queryMappings.bind(this);
    this.renderVisualMonitor = this.renderVisualMonitor.bind(this);
    this.renderExtractionQuery = this.renderExtractionQuery.bind(this);
    this.renderClusterMetricsMonitor = this.renderClusterMetricsMonitor.bind(this);
    this.getMonitorContent = this.getMonitorContent.bind(this);
    this.getPlugins = this.getPlugins.bind(this);
    this.getSupportedApiList = this.getSupportedApiList.bind(this);
    this.showPluginWarning = this.showPluginWarning.bind(this);
  }

  componentDidMount() {
    this.getPlugins();
    const { searchType, index, timeField } = this.props.values;
    const isGraph = searchType === SEARCH_TYPE.GRAPH;
    const hasIndices = !!index.length;
    const hasTimeField = !!timeField;
    if (isGraph && hasIndices) {
      this.onQueryMappings();
      if (hasTimeField) this.onRunQuery();
    }
    if (searchType === SEARCH_TYPE.CLUSTER_METRICS) this.getSupportedApiList();
  }

  componentDidUpdate(prevProps) {
    const {
      searchType: prevSearchType,
      index: prevIndex,
      timeField: prevTimeField,
      monitor_type: prevMonitorType,
      groupBy: prevGroupBy,
      aggregations: prevAggregations,
      bucketValue: prevBucketValue,
      bucketUnitOfTime: prevBucketUnitOfTime,
      where: prevWhere,
    } = prevProps.values;
    const {
      searchType,
      index,
      timeField,
      monitor_type,
      groupBy,
      aggregations,
      bucketValue,
      bucketUnitOfTime,
      where,
    } = this.props.values;
    const isGraph = searchType === SEARCH_TYPE.GRAPH;
    const hasIndices = !!index.length;
    // If customer is defining query through extraction query, then they are manually running their own queries
    // Below logic is for customers defining queries through graph/visual way.
    if (isGraph && hasIndices) {
      // If current query type is graph and there are indices selected, then we want to query new index mappings if
      // a) previous query type was query (to get the first load of mappings)
      // b) different indices, to get new mappings
      const wasQuery = prevSearchType === SEARCH_TYPE.QUERY;
      const diffIndices = prevIndex !== index;
      if (wasQuery || diffIndices) {
        this.onQueryMappings();
      }
      // If there is a timeField selected, then we want to run the query if
      // a) previous query type was query (to get first run executed)
      // b) different indices, to get new data
      // c) different time fields, to aggregate on new data/axis
      const diffTimeFields = prevTimeField !== timeField;
      const hasTimeField = !!timeField;
      const wasQueryType =
        prevMonitorType === MONITOR_TYPE.QUERY_LEVEL && monitor_type === MONITOR_TYPE.BUCKET_LEVEL;
      if (hasTimeField) {
        if (wasQuery || diffIndices || diffTimeFields || wasQueryType) this.onRunQuery();
      }
    }
    const groupByCleared = prevGroupBy && !groupBy;

    if (
      prevAggregations !== aggregations ||
      prevBucketValue !== bucketValue ||
      prevBucketUnitOfTime !== bucketUnitOfTime ||
      prevWhere !== where ||
      prevGroupBy !== groupBy
    )
      this.onRunQuery();

    // Reset response when monitor type or definition method is changed
    if (prevSearchType !== searchType || prevMonitorType !== monitor_type || groupByCleared) {
      this.resetResponse();
      if (searchType === SEARCH_TYPE.CLUSTER_METRICS) this.getSupportedApiList();
    }
  }

  async getPlugins() {
    const { httpClient } = this.props;
    try {
      const pluginsResponse = await httpClient.get('../api/alerting/_plugins');
      if (pluginsResponse.ok) {
        this.setState({ plugins: pluginsResponse.resp.map((plugin) => plugin.component) });
      } else {
        console.error('There was a problem getting plugins list');
      }
    } catch (e) {
      console.error('There was a problem getting plugins list', e);
    }
  }

  getBucketMonitorGraphs = (aggregations, formikSnapshot, response) => {
    // Default `count of documents` graph when using Bucket-level monitor
    let graphs = [
      <Fragment key={`multi-visual-graph-0`}>
        <VisualGraph values={formikSnapshot} fieldName="doc_count" response={response} />
      </Fragment>,
    ];

    aggregations.map((field, index) => {
      graphs.push(
        <Fragment key={`multi-visual-graph-${index + 1}`}>
          <EuiSpacer size="m" />
          <VisualGraph
            values={formikSnapshot}
            fieldName={field.fieldName}
            aggregationType={field.aggregationType}
            response={response}
          />
        </Fragment>
      );
    });

    return graphs;
  };

  renderGraph() {
    const { errors, values } = this.props;
    const { response, performanceResponse, formikSnapshot } = this.state;
    const aggregations = _.get(values, 'aggregations');
    const isBucketLevel = values.monitor_type === MONITOR_TYPE.BUCKET_LEVEL;

    return (
      <Fragment>
        <EuiSpacer size="s" />
        <MonitorExpressions errors={errors} dataTypes={this.state.dataTypes} />
        <EuiSpacer size="xl" />

        <EuiAccordion
          id="preview-query-performance-accordion"
          buttonContent="Preview query and performance"
        >
          <EuiSpacer size="s" />
          <QueryPerformance response={performanceResponse} />
          <EuiSpacer size="m" />

          {errors.where ? (
            renderEmptyMessage('Invalid input in data filter. Remove data filter or adjust filter ')
          ) : isBucketLevel ? (
            this.getBucketMonitorGraphs(aggregations, formikSnapshot, response)
          ) : (
            <VisualGraph values={formikSnapshot} response={response} />
          )}
        </EuiAccordion>
        <EuiSpacer size="m" />
      </Fragment>
    );
  }

  async onRunQuery() {
    this.setState({ loadingResponse: true });
    const { httpClient, values, notifications } = this.props;
    const formikSnapshot = _.cloneDeep(values);

    const searchType = values.searchType;
    let requests;
    switch (searchType) {
      case SEARCH_TYPE.QUERY:
        requests = [buildSearchRequest(values)];
        break;
      case SEARCH_TYPE.GRAPH:
        // TODO: Might need to check if groupBy is defined if monitor_type === Graph, and prevent onRunQuery() if no group by defined to avoid errors.
        // If we are running a visual graph query, then we need to run two separate queries
        // 1. The actual query that will be saved on the monitor, to get accurate query performance stats
        // 2. The UI generated query that gets [BUCKET_COUNT] times the aggregated buckets to show past history of query
        // If the query is an extraction query, we can use the same query for results and query performance
        requests = [buildSearchRequest(values)];
        requests.push(buildSearchRequest(values, false));
        break;
      case SEARCH_TYPE.CLUSTER_METRICS:
        requests = [buildClusterMetricsRequest(values)];
        break;
    }

    try {
      const promises = requests.map((request) => {
        // Fill in monitor name in case it's empty (in create workflow)
        // Set triggers to empty array so they are not executed (if in edit workflow)
        // Set input search to query/graph query and then use execute API to fill in period_start/period_end
        const monitor = formikToMonitor(values);
        _.set(monitor, 'name', 'TEMP_MONITOR');
        _.set(monitor, 'triggers', []);

        switch (searchType) {
          case SEARCH_TYPE.QUERY:
          case SEARCH_TYPE.GRAPH:
            _.set(monitor, 'inputs[0].search', request);
            break;
          case SEARCH_TYPE.CLUSTER_METRICS:
            _.set(monitor, 'inputs[0].uri', request);
            break;
          default:
            console.log(`Unsupported searchType found: ${JSON.stringify(searchType)}`, searchType);
        }

        return httpClient.post('../api/alerting/monitors/_execute', {
          body: JSON.stringify(monitor),
        });
      });

      const [queryResponse, optionalResponse] = await Promise.all(promises);

      if (queryResponse.ok) {
        const response = _.get(queryResponse.resp, 'input_results.results[0]');
        // If there is an optionalResponse use it's results, otherwise use the original response
        const performanceResponse = optionalResponse
          ? _.get(optionalResponse, 'resp.input_results.results[0]', null)
          : response;
        this.setState({ response, formikSnapshot, performanceResponse });
      } else {
        console.error('There was an error running the query', queryResponse.resp);
        backendErrorNotification(notifications, 'run', 'query', queryResponse.resp);
        this.setState({ response: null, formikSnapshot: null, performanceResponse: null });
      }
    } catch (err) {
      console.error('There was an error running the query', err);
    }
    this.setState({ loadingResponse: false });
  }

  resetResponse() {
    this.setState({ response: null, performanceResponse: null });
  }

  async onQueryMappings() {
    const index = this.props.values.index.map(({ label }) => label);
    try {
      const mappings = await this.queryMappings(index);
      const dataTypes = getPathsPerDataType(mappings);
      this.setState({ dataTypes });
    } catch (err) {
      console.error('There was an error getting mappings for query', err);
    }
  }

  async queryMappings(index) {
    if (!index.length) {
      return {};
    }

    try {
      const response = await this.props.httpClient.post('../api/alerting/_mappings', {
        body: JSON.stringify({ index }),
      });
      if (response.ok) {
        return response.resp;
      }
      return {};
    } catch (err) {
      throw err;
    }
  }

  renderVisualMonitor() {
    const { values } = this.props;
    const { index, timeField } = values;
    let content = null;
    if (index.length) {
      content = timeField
        ? this.renderGraph()
        : renderEmptyMessage('You must specify a time field.');
    } else {
      content = renderEmptyMessage('You must specify an index.');
    }
    return {
      actions: [],
      content: (
        <React.Fragment>
          <div style={{ padding: '0px 10px' }}>{content}</div>
        </React.Fragment>
      ),
    };
  }

  renderExtractionQuery() {
    const { values, isDarkMode } = this.props;
    const { response, performanceResponse } = this.state;
    let invalidJSON = false;
    try {
      JSON.parse(values.query);
    } catch (e) {
      invalidJSON = true;
    }
    const runIsDisabled = invalidJSON || !values.index.length;
    let content = renderEmptyMessage('You must specify an index.');

    if (values.index.length) {
      content = (
        <ExtractionQuery
          response={JSON.stringify(response || '', null, 4)}
          isDarkMode={isDarkMode}
        />
      );
    }
    return {
      actions: [
        <EuiButton disabled={runIsDisabled} onClick={this.onRunQuery}>
          Run
        </EuiButton>,
      ],
      content: (
        <React.Fragment>
          <div style={{ padding: '0px 10px' }}>{content}</div>
          <EuiSpacer size="m" />
          <QueryPerformance response={performanceResponse} />
        </React.Fragment>
      ),
    };
  }

  renderClusterMetricsMonitor() {
    const { values } = this.props;
    const {
      loadingResponse,
      loadingSupportedApiList = false,
      response,
      supportedApiList,
    } = this.state;
    return {
      content: (
        <div style={{ padding: '0px 10px' }}>
          <ClusterMetricsMonitor
            isDarkMode={this.isDarkMode}
            loadingResponse={loadingResponse}
            loadingSupportedApiList={loadingSupportedApiList}
            onRunQuery={this.onRunQuery}
            resetResponse={this.resetResponse}
            response={JSON.stringify(response || '', null, 4)}
            supportedApiList={supportedApiList}
            values={values}
          />
        </div>
      ),
    };
  }

  async getSupportedApiList() {
    this.setState({ loadingSupportedApiList: true });
    const { httpClient, values } = this.props;
    const requests = [];
    _.keys(API_TYPES).forEach((apiKey) => {
      let requiresPathParams = _.get(API_TYPES, `${apiKey}.paths.withoutPathParams`);
      requiresPathParams = _.isEmpty(requiresPathParams);
      if (!requiresPathParams) {
        const path = _.get(API_TYPES, `${apiKey}.paths.withoutPathParams`);
        const values = { uri: { ...FORMIK_INITIAL_VALUES.uri, path } };
        requests.push(buildClusterMetricsRequest(values));
      }
    });

    const promises = requests.map((request) => {
      const monitor = formikToMonitor(values);
      const tempMonitorName = getApiType(request);
      _.set(monitor, 'name', tempMonitorName);
      _.set(monitor, 'triggers', []);
      _.set(monitor, 'inputs[0].uri', request);
      return httpClient.post('../api/alerting/monitors/_execute', {
        body: JSON.stringify(monitor),
      });
    });

    let supportedApiList = [];
    await Promise.all(promises).then((responses) => {
      responses.forEach((response) => {
        if (response.ok) {
          const supportedApi = _.get(response, 'resp.monitor_name');
          supportedApiList.push({
            value: supportedApi,
            label: _.get(API_TYPES, `${supportedApi}.label`),
          });
        }
      });
    });

    // DefineMonitor::getSupportedApiList attempts to create a list of API for which the user can create monitors.
    // It does this by calling all of the feature-supported API without parameters, and adding successful API to a list.
    // However, some API require path parameters. The below logic will add those API to the list by default.
    // Attempting to create a monitor using one of those API will still throw an exception from the backend if the user
    // has configured the OpenSearch-Alerting Plugin supported_json_payloads.json to restrict access to those API.
    let clonedSupportedApiList = _.cloneDeep(supportedApiList);
    getApiTypesRequiringPathParams().forEach((apiType) => {
      if (!supportedApiList.includes(apiType)) clonedSupportedApiList.push(apiType);
    });
    clonedSupportedApiList = _.orderBy(clonedSupportedApiList, (api) => api.label);

    this.setState({
      loadingSupportedApiList: false,
      supportedApiList: clonedSupportedApiList,
    });
  }

  getMonitorContent() {
    const { values } = this.props;
    switch (values.searchType) {
      case SEARCH_TYPE.GRAPH:
        return this.renderVisualMonitor();
      case SEARCH_TYPE.CLUSTER_METRICS:
        return this.renderClusterMetricsMonitor();
      default:
        return this.renderExtractionQuery();
    }
  }

  showPluginWarning() {
    const { values } = this.props;
    const { plugins } = this.state;
    return values.searchType == SEARCH_TYPE.AD && plugins.indexOf(OS_AD_PLUGIN) == -1;
  }

  render() {
    const { values, errors, httpClient, detectorId, notifications, isDarkMode } = this.props;
    const { dataTypes } = this.state;
    const monitorContent = this.getMonitorContent();
    const { searchType } = this.props.values;
    const isGraphOrQuery = searchType === SEARCH_TYPE.GRAPH || searchType === SEARCH_TYPE.QUERY;

    return (
      <div>
        {isGraphOrQuery && (
          <div>
            <DataSource
              values={values}
              dataTypes={dataTypes}
              errors={errors}
              httpClient={httpClient}
              detectorId={detectorId}
              notifications={notifications}
              isDarkMode={isDarkMode}
            />
            <EuiSpacer />
          </div>
        )}

        <ContentPanel
          title="Query"
          titleSize="s"
          panelStyles={{
            paddingLeft: '10px',
            paddingRight: '10px',
          }}
          bodyStyles={{ padding: 'initial' }}
          actions={monitorContent.actions}
        >
          {this.showPluginWarning()
            ? [
                <EuiCallOut
                  color="warning"
                  title="Anomaly detector plugin is not installed on Opensearch, This monitor will not functional properly."
                  iconType="help"
                  size="s"
                />,
                <EuiSpacer size="s" />,
              ]
            : null}

          {monitorContent.content}
        </ContentPanel>
      </div>
    );
  }
}

DefineMonitor.propTypes = propTypes;
DefineMonitor.defaultProps = defaultProps;

export default DefineMonitor;
