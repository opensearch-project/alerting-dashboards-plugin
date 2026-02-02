/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import querystring from 'querystring';

import { INDEX } from '../../utils/constants';
import { MDSEnabledClientService } from './MDSEnabledClientService';
import { isIndexNotFoundError } from './utils/helpers';
import { DEFAULT_HEADERS, PPL_MONITOR_BASE_API } from './utils/constants';

const ALERTS_BASE_PATH = `${PPL_MONITOR_BASE_API}/alerts`;

const isNoHandlerError = (err) =>
  err &&
  (err.response?.includes?.('no handler found for uri') ||
    err.body?.error?.includes?.('no handler found for uri') ||
    err.message?.includes?.('no handler found for uri') ||
    String(err).includes('no handler found for uri'));

export default class PplAlertingMonitorService extends MDSEnabledClientService {
  constructor(osDriver, dataSourceEnabled, logger) {
    super(osDriver, dataSourceEnabled);
    this.logger = logger;
  }

  logWarn(message) {
    if (this.logger?.warn) {
      this.logger.warn(message);
    } else {
      // eslint-disable-next-line no-console
      console.warn(message);
    }
  }

  logError(message, err) {
    if (this.logger?.error) {
      this.logger.error(`${message}: ${err?.message ?? err}`);
    } else {
      // eslint-disable-next-line no-console
      console.error(message, err);
    }
  }

  buildAlertsPath(query = {}, { omitDataSourceId = false } = {}) {
    const queryCopy = { ...query };
    if (omitDataSourceId) {
      delete queryCopy.dataSourceId;
    }
    const queryString = querystring.stringify(queryCopy);
    return `${ALERTS_BASE_PATH}${queryString ? `?${queryString}` : ''}`;
  }

  normalizeAlertsQuery(query = {}) {
    const {
      from,
      size,
      sortField,
      sortDirection,
      search,
      severityLevel,
      monitorIds,
      monitorId,
      alertState,
      dataSourceId,
    } = query;

    const normalized = {};

    if (size !== undefined) {
      const parsedSize = Number(size);
      if (!Number.isNaN(parsedSize)) normalized.size = parsedSize;
    }

    if (from !== undefined) {
      const parsedFrom = Number(from);
      if (!Number.isNaN(parsedFrom)) normalized.startIndex = parsedFrom;
    }

    if (sortField) {
      const sortFieldString = String(sortField);
      const sortFieldMap = {
        start_time: 'triggered_time',
        startTime: 'triggered_time',
      };
      normalized.sortString = sortFieldMap[sortFieldString] || sortFieldString;
    }
    if (sortDirection) normalized.sortOrder = String(sortDirection).toLowerCase();
    if (search) normalized.searchString = String(search);

    if (severityLevel && String(severityLevel).toUpperCase() !== 'ALL') {
      normalized.severityLevel = String(severityLevel);
    }

    if (alertState && String(alertState).toUpperCase() !== 'ALL') {
      normalized.alertState = String(alertState);
    }

    if (dataSourceId !== undefined) {
      normalized.dataSourceId = dataSourceId;
    }

    const monitorIdValue = Array.isArray(monitorIds) ? monitorIds[0] : monitorIds ?? monitorId;
    if (monitorIdValue) normalized.monitorId = String(monitorIdValue);

    return normalized;
  }

  normalizeMonitorListQuery(query = {}) {
    const { from, size, search, sortField, sortDirection, state, dataSourceId } = query;
    const normalized = {};

    if (dataSourceId !== undefined) {
      normalized.dataSourceId = dataSourceId;
    }
    if (from !== undefined) {
      const parsedFrom = Number(from);
      if (!Number.isNaN(parsedFrom)) normalized.from = parsedFrom;
    }
    if (size !== undefined) {
      const parsedSize = Number(size);
      if (!Number.isNaN(parsedSize)) normalized.size = parsedSize;
    }
    if (search) normalized.search = String(search);
    if (sortField) normalized.sortField = String(sortField);
    if (sortDirection) normalized.sortDirection = String(sortDirection);
    if (state) normalized.state = String(state);
    return normalized;
  }

  async proxyPPLQuery(context, req, res) {
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      const params = {
        method: 'POST',
        path: '/_plugins/_ppl',
        body: req.body,
        headers: DEFAULT_HEADERS,
      };
      const resp = await client('transport.request', params);
      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      if (err?.body?.status === 404 || err?.statusCode === 404) {
        this.logger.debug('PPL proxy query failed with 404 (likely invalid query or data source)');
      } else if (err?.body?.status === 400 || err?.statusCode === 400) {
        this.logger.debug('PPL proxy query returned bad request (suppressing error log)');
      } else {
        this.logError('Alerting - PplAlertingMonitorService - proxyPPLQuery', err);
      }
      return res.ok({
        body: {
          ok: false,
          resp: err?.body?.message || err?.message || 'Incorrect data source or invalid query',
        },
      });
    }
  }

  async listIndices(context, req, res) {
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      const resp = await client('transport.request', {
        method: 'GET',
        path: '/_cat/indices?format=json&h=index',
        headers: DEFAULT_HEADERS,
      });
      const body = resp?.body ?? resp;
      const rows = Array.isArray(body) ? body : [];
      const names = rows.map((row) => row.index).filter(Boolean);
      const indices = Array.from(new Set(names)).sort();
      return res.ok({ body: { ok: true, indices } });
    } catch (err) {
      this.logError('Alerting - PplAlertingMonitorService - listIndices', err);
      return res.ok({ body: { ok: false, indices: [], resp: err?.message ?? err } });
    }
  }

  async getMonitors(context, req, res) {
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      const {
        from = 0,
        size = 20,
        search = '',
        sortField = 'name',
        sortDirection = 'desc',
        state = 'all',
      } = this.normalizeMonitorListQuery(req.query);

      const monitorIds = req.query?.monitorIds;
      const sanitizedFrom = Number.isFinite(from) ? from : 0;
      const sanitizedSize = Number.isFinite(size) ? size : 20;
      const sanitizedSortDirection = String(sortDirection).toLowerCase() === 'asc' ? 'asc' : 'desc';
      const searchText = typeof search === 'string' ? search.trim() : '';

      let mustClause = { match_all: {} };
      if (searchText) {
        mustClause = {
          query_string: {
            fields: [
              'monitor.name',
              'ppl_monitor.name',
              'monitor_v2.ppl_monitor.name',
              'workflow.name',
            ],
            default_operator: 'AND',
            query: `*${searchText.split(' ').join('* *')}*`,
          },
        };
      }

      const mustList = [mustClause];

      if (monitorIds !== undefined) {
        const idsArray = Array.isArray(monitorIds)
          ? monitorIds
          : String(monitorIds)
              .split(',')
              .map((id) => id.trim())
              .filter(Boolean);
        if (idsArray.length) {
          mustList.push({
            terms: { _id: idsArray },
          });
        } else if (monitorIds === 'empty') {
          mustList.push({
            terms: { _id: [] },
          });
        }
      }

      const should = [];
      if (state !== 'all') {
        const enabled = state === 'enabled';
        should.push({ term: { 'monitor.enabled': enabled } });
        should.push({ term: { 'workflow.enabled': enabled } });
        should.push({ term: { 'monitor.monitor_v2.ppl_monitor.enabled': enabled } });
        should.push({ term: { 'ppl_monitor.enabled': enabled } });
      }

      const monitorSorts = { name: 'monitor.name.keyword' };
      const monitorSortPageData = { size: 1000 };

      if (monitorSorts[sortField]) {
        monitorSortPageData.sort = [{ [monitorSorts[sortField]]: sanitizedSortDirection }];
        monitorSortPageData.size = sanitizedSize;
        monitorSortPageData.from = sanitizedFrom;
      }

      const searchBody = {
        seq_no_primary_term: true,
        version: true,
        ...monitorSortPageData,
        query: {
          bool: {
            should,
            minimum_should_match: state !== 'all' ? 1 : 0,
            must: mustList,
          },
        },
        aggregations: {
          associated_composite_monitors: {
            nested: {
              path: 'workflow.inputs.composite_input.sequence.delegates',
            },
            aggs: {
              monitor_ids: {
                terms: {
                  field: 'workflow.inputs.composite_input.sequence.delegates.monitor_id',
                },
              },
            },
          },
        },
      };

      const searchResponse = await client('transport.request', {
        method: 'POST',
        path: `${PPL_MONITOR_BASE_API}/_search`,
        body: searchBody,
        headers: DEFAULT_HEADERS,
      });

      const allHits = _.get(searchResponse, 'hits.hits', []);
      const totalHits = Number(_.get(searchResponse, 'hits.total.value', allHits.length)) || 0;
      const filteredHits = allHits.filter((result) => {
        const id = result?._id ?? '';
        const monitorSource = result?._source?.monitor || result?._source || {};
        return !(typeof id === 'string' && id.endsWith('-metadata')) && !monitorSource.metadata;
      });

      const metadataCount = allHits.length - filteredHits.length;
      const totalMonitors = Math.max(totalHits - metadataCount, filteredHits.length);

      const monitorKeyValueTuples = filteredHits.map((result) => {
        const {
          _id: id,
          _version: version,
          _seq_no: ifSeqNo,
          _primary_term: ifPrimaryTerm,
          _source,
        } = result;

        let monitor = _source?.monitor ? _source.monitor : _source || {};
        const pplMonitor = monitor?.monitor_v2?.ppl_monitor || monitor?.ppl_monitor;
        if (pplMonitor) {
          monitor = {
            ...monitor,
            ...pplMonitor,
            monitor_v2: monitor.monitor_v2,
          };
        }

        if (!monitor.monitor_type) {
          monitor.monitor_type = 'query_level';
        }

        const item_type = monitor.workflow_type || monitor.monitor_type || 'query_level';
        const name = monitor.name || id;
        const enabled = Boolean(monitor.enabled);

        if (!Array.isArray(monitor.triggers)) {
          monitor.triggers = [];
        }

        return [
          id,
          {
            id,
            version,
            ifSeqNo,
            ifPrimaryTerm,
            name,
            enabled,
            item_type,
            monitor,
          },
        ];
      });

      const monitorMap = new Map(monitorKeyValueTuples);
      const associatedCompositeMonitorCountMap = {};

      _.get(
        searchResponse,
        'aggregations.associated_composite_monitors.monitor_ids.buckets',
        []
      ).forEach(({ key, doc_count }) => {
        associatedCompositeMonitorCountMap[key] = doc_count;
      });

      const monitorIdsOutput = [...monitorMap.keys()];

      const aggsOrderData = {};
      const aggsSorts = {
        active: 'active',
        acknowledged: 'acknowledged',
        errors: 'errors',
        ignored: 'ignored',
        lastNotificationTime: 'last_notification_time',
      };

      if (aggsSorts[sortField]) {
        aggsOrderData.order = { [aggsSorts[sortField]]: sanitizedSortDirection };
      }

      let buckets = [];
      if (monitorIdsOutput.length > 0) {
        const alertsSearchBody = {
          size: 0,
          query: { terms: { monitor_id: monitorIdsOutput } },
          aggregations: {
            uniq_monitor_ids: {
              terms: {
                field: 'monitor_id',
                ...aggsOrderData,
                size: sanitizedFrom + sanitizedSize,
              },
              aggregations: {
                active: { filter: { term: { state: 'ACTIVE' } } },
                acknowledged: { filter: { term: { state: 'ACKNOWLEDGED' } } },
                errors: { filter: { term: { state: 'ERROR' } } },
                ignored: {
                  filter: {
                    bool: {
                      filter: { term: { state: 'COMPLETED' } },
                      must_not: { exists: { field: 'acknowledged_time' } },
                    },
                  },
                },
                last_notification_time: { max: { field: 'last_notification_time' } },
                latest_alert: {
                  top_hits: {
                    size: 1,
                    sort: [{ start_time: { order: 'desc' } }],
                    _source: { includes: ['last_notification_time', 'trigger_name'] },
                  },
                },
              },
            },
          },
        };

        try {
          const alertsResponse = await client('transport.request', {
            method: 'POST',
            path: `/${INDEX.ALL_ALERTS}/_search`,
            body: alertsSearchBody,
            headers: DEFAULT_HEADERS,
          });

          buckets = _.get(alertsResponse, 'aggregations.uniq_monitor_ids.buckets', [])
            .map((bucket) => {
              const {
                key: id,
                last_notification_time: { value: lastNotificationTime } = { value: null },
                ignored: { doc_count: ignored } = { doc_count: 0 },
                acknowledged: { doc_count: acknowledged } = { doc_count: 0 },
                active: { doc_count: active } = { doc_count: 0 },
                errors: { doc_count: errors } = { doc_count: 0 },
                latest_alert: {
                  hits: { hits: [{ _source: { trigger_name: latestAlert } = {} } = {}] = [] } = {},
                } = {},
              } = bucket;

              const monitor = monitorMap.get(id);
              if (!monitor) {
                return null;
              }
              monitorMap.delete(id);

              return {
                ...monitor,
                id,
                lastNotificationTime,
                ignored,
                latestAlert,
                acknowledged,
                active,
                errors,
                currentTime: Date.now(),
                associatedCompositeMonitorCnt: associatedCompositeMonitorCountMap[id] || 0,
              };
            })
            .filter(Boolean);
        } catch (err) {
          if (!isIndexNotFoundError(err)) {
            throw err;
          }
        }
      }

      const unusedMonitors = [...monitorMap.values()].map((monitor) => ({
        ...monitor,
        lastNotificationTime: null,
        ignored: 0,
        active: 0,
        acknowledged: 0,
        errors: 0,
        latestAlert: '--',
        currentTime: Date.now(),
        associatedCompositeMonitorCnt: associatedCompositeMonitorCountMap[monitor.id] || 0,
      }));

      const combinedResults = buckets.concat(unusedMonitors);
      const sortKey = sortField || 'name';
      const orderDirection = sanitizedSortDirection;

      let results = _.orderBy(combinedResults, [sortKey], [orderDirection]);

      if (!monitorSorts[sortField]) {
        results = results.slice(sanitizedFrom, sanitizedFrom + sanitizedSize);
      }

      return res.ok({
        body: {
          ok: true,
          monitors: results,
          totalMonitors,
        },
      });
    } catch (err) {
      this.logError('Alerting - PplAlertingMonitorService - getMonitors', err);
      return res.ok({ body: { ok: false, resp: err?.message ?? err } });
    }
  }

  async searchMonitors(context, req, res) {
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      const resp = await client('transport.request', {
        method: 'POST',
        path: `${PPL_MONITOR_BASE_API}/_search`,
        body: req.body,
        headers: DEFAULT_HEADERS,
      });
      return res.ok({ body: resp });
    } catch (err) {
      this.logError('Alerting - PplAlertingMonitorService - searchMonitors', err);
      return res.ok({ body: { ok: false, resp: err?.message ?? err } });
    }
  }

  async createMonitor(context, req, res) {
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      const resp = await client('transport.request', {
        method: 'POST',
        path: PPL_MONITOR_BASE_API,
        body: req.body,
        headers: DEFAULT_HEADERS,
      });
      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      this.logError('Alerting - PplAlertingMonitorService - createMonitor', err);
      return res.ok({ body: { ok: false, resp: err?.message ?? err } });
    }
  }

  async updateMonitor(context, req, res) {
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      const id = req.params.id;
      const ifSeqNo = req.query?.if_seq_no ?? req.query?.ifSeqNo;
      const ifPrimaryTerm = req.query?.if_primary_term ?? req.query?.ifPrimaryTerm;

      const qs = new URLSearchParams();
      if (Number.isFinite(Number(ifSeqNo))) qs.append('if_seq_no', String(ifSeqNo));
      if (Number.isFinite(Number(ifPrimaryTerm)))
        qs.append('if_primary_term', String(ifPrimaryTerm));

      let cleanedBody = req.body;
      if (req.body?.ppl_monitor) {
        const {
          enabled_time,
          schema_version,
          last_update_time,
          user,
          id: monitorId,
          last_update_time_ms,
          monitor_version,
          version,
          ...cleanMonitor
        } = req.body.ppl_monitor;

        if (Array.isArray(cleanMonitor.triggers)) {
          cleanMonitor.triggers = cleanMonitor.triggers.map(
            ({ id: triggerId, last_triggered_time, last_execution_time, ...trigger }) => trigger
          );
        }

        cleanedBody = { ppl_monitor: cleanMonitor };
      }

      const resp = await client('transport.request', {
        method: 'PUT',
        path: `${PPL_MONITOR_BASE_API}/${encodeURIComponent(id)}${
          qs.toString() ? `?${qs.toString()}` : ''
        }`,
        body: cleanedBody,
        headers: DEFAULT_HEADERS,
      });
      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      this.logError('Alerting - PplAlertingMonitorService - updateMonitor', err);
      return res.ok({ body: { ok: false, resp: err?.message ?? err } });
    }
  }

  async getMonitor(context, req, res) {
    try {
      const id = req.params.id;
      const client = this.getClientBasedOnDataSource(context, req);

      const raw = await client('transport.request', {
        method: 'GET',
        path: `${PPL_MONITOR_BASE_API}/${encodeURIComponent(id)}`,
        headers: DEFAULT_HEADERS,
      });

      const monitor =
        _.get(raw, 'monitor_v2.ppl_monitor') ||
        _.get(raw, 'monitorV2.ppl_monitor') ||
        _.get(raw, 'ppl_monitor') ||
        _.get(raw, 'monitor') ||
        _.get(raw, '_source') ||
        {};

      const normalized = {
        ...monitor,
        monitor_type: monitor.monitor_type || 'query_level',
        item_type: monitor.workflow_type || monitor.monitor_type || 'query_level',
        id,
        version: _.get(raw, '_version', null),
      };
      normalized.triggers = Array.isArray(normalized.triggers) ? normalized.triggers : [];
      normalized.ui_metadata = normalized.ui_metadata || { triggers: {} };

      return res.ok({
        body: {
          ok: true,
          resp: normalized,
          version: _.get(raw, '_version', null),
          ifSeqNo: _.get(raw, '_seq_no', null),
          ifPrimaryTerm: _.get(raw, '_primary_term', null),
          activeCount: 0,
          dayCount: 0,
        },
      });
    } catch (err) {
      this.logError('Alerting - PplAlertingMonitorService - getMonitor', err);
      return res.ok({ body: { ok: false, resp: err?.message ?? err } });
    }
  }

  async deleteMonitor(context, req, res) {
    try {
      const id = req.params.id;
      const client = this.getClientBasedOnDataSource(context, req);
      const resp = await client('transport.request', {
        method: 'DELETE',
        path: `${PPL_MONITOR_BASE_API}/${encodeURIComponent(id)}`,
        headers: DEFAULT_HEADERS,
      });
      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      this.logError('Alerting - PplAlertingMonitorService - deleteMonitor', err);
      return res.ok({ body: { ok: false, resp: err?.message ?? err } });
    }
  }

  async executeMonitorById(context, req, res) {
    try {
      const id = req.params.id;
      const client = this.getClientBasedOnDataSource(context, req);
      const resp = await client('transport.request', {
        method: 'POST',
        path: `${PPL_MONITOR_BASE_API}/${encodeURIComponent(id)}/_execute`,
        body: req.body,
        headers: DEFAULT_HEADERS,
      });
      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      this.logError('Alerting - PplAlertingMonitorService - executeMonitorById', err);
      return res.ok({ body: { ok: false, resp: err?.message ?? err } });
    }
  }

  async executeMonitor(context, req, res) {
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      const resp = await client('transport.request', {
        method: 'POST',
        path: `${PPL_MONITOR_BASE_API}/_execute`,
        body: req.body,
        headers: DEFAULT_HEADERS,
      });
      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      this.logError('Alerting - PplAlertingMonitorService - executeMonitor', err);
      return res.ok({ body: { ok: false, resp: err?.message ?? err } });
    }
  }

  async alertsForMonitors(context, req, res) {
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      const backendQuery = this.normalizeAlertsQuery(req.query);
      const path = this.buildAlertsPath(backendQuery, { omitDataSourceId: true });

      const resp = await client('transport.request', {
        method: 'GET',
        path,
        headers: DEFAULT_HEADERS,
      });

      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      if (isIndexNotFoundError(err)) {
        this.logWarn(
          '[Alerting][PPL] Alerts history index not found. Returning empty alerts list.'
        );
        return res.ok({
          body: {
            ok: true,
            resp: { alerts_v2: [], total_alerts_v2: 0 },
          },
        });
      }

      if (isNoHandlerError(err)) {
        this.logWarn('[Alerting][PPL] v2 alerts endpoint not available on target cluster');
        return res.ok({
          body: {
            ok: false,
            resp: 'alerts v2 endpoint not available on the selected data source',
          },
        });
      }

      this.logError('Alerting - PplAlertingMonitorService - alertsForMonitors', err);
      return res.ok({ body: { ok: false, resp: err?.message ?? err } });
    }
  }
}
