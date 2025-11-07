/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import querystring from 'querystring';

import { INDEX } from '../../utils/constants';
import { isIndexNotFoundError } from './utils/helpers';
import { MDSEnabledClientService } from './MDSEnabledClientService';
import { DEFAULT_HEADERS, FEATURE_FLAGS } from './utils/constants';

const isNoHandlerError = (err) =>
  err &&
  (err.response?.includes?.('no handler found for uri') ||
    err.body?.error?.includes?.('no handler found for uri') ||
    err.message?.includes?.('no handler found for uri') ||
    String(err).includes('no handler found for uri'));

const isLegacyMonitorDeleteError = (err) => {
  const reason = err?.body?.error?.reason || err?.message || String(err || '');
  return typeof reason === 'string' && reason.includes('Alerting V1 Monitor');
};

const isV2MonitorPayload = (body) =>
  !!body?.ppl_monitor || body?.query_language === 'ppl' || body?.monitor?.query_language === 'ppl';

export default class MonitorService extends MDSEnabledClientService {
  constructor(osDriver, dataSourceEnabled, featureFlagService, logger) {
    super(osDriver, dataSourceEnabled);
    this.featureFlagService = featureFlagService;
    this.logger = logger;
  }

  async isPplMonitorEnabled(request) {
    if (!this.featureFlagService) {
      return true;
    }
    try {
      return await this.featureFlagService.isFeatureEnabled(request, FEATURE_FLAGS.PPL_MONITOR);
    } catch (err) {
      this.logger?.warn?.(
        `[Alerting][MonitorService] Failed to resolve feature flag ${FEATURE_FLAGS.PPL_MONITOR}: ${
          err?.message ?? err
        }`
      );
      return this.featureFlagService.getDefault(FEATURE_FLAGS.PPL_MONITOR);
    }
  }

  pplFeatureDisabled(res) {
    return res.forbidden({ body: { message: 'PPL-based alerting is disabled' } });
  }

  buildAlertsPath(query = {}, { omitDataSourceId = false } = {}) {
    const queryCopy = { ...query };
    if (omitDataSourceId) {
      delete queryCopy.dataSourceId;
    }
    const queryString = querystring.stringify(queryCopy);
    return `/_plugins/_alerting/v2/monitors/alerts${queryString ? `?${queryString}` : ''}`;
  }

  normalizeAlertsQuery(query = {}) {
    const { from, size, sortField, sortDirection, search, severityLevel, monitorIds, monitorId } =
      query;

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

    const monitorIdValue = Array.isArray(monitorIds) ? monitorIds[0] : monitorIds ?? monitorId;
    if (monitorIdValue) normalized.monitorId = String(monitorIdValue);

    return normalized;
  }

  /** ---------- NEW: generic PPL query passthrough (/_plugins/_ppl) ---------- */
  pplQuery = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    try {
      // Data-source–aware client (adds headers/routeing as needed)
      const client = this.getClientBasedOnDataSource(context, req);

      // Use transport.request so we don't depend on any specific client mapping
      const params = {
        method: 'POST',
        path: '/_plugins/_ppl',
        body: req.body, // must be: { query: "<ppl text>" }
        headers: DEFAULT_HEADERS,
      };

      const resp = await client('transport.request', params);
      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      console.error('Alerting - MonitorService - pplQuery:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };
  /** ------------------------------------------------------------------------ */

  listIndices = async (context, req, res) => {
    try {
      const client = this.getClientBasedOnDataSource(context, req);

      // Ask only for the index column and JSON back
      const path = '/_cat/indices?format=json&h=index';

      const resp = await client('transport.request', {
        method: 'GET',
        path,
        headers: DEFAULT_HEADERS,
      });

      // Handle both shapes: resp or { body: [...] }
      const body = resp?.body ?? resp; // support both client shapes
      const rows = Array.isArray(body) ? body : [];
      const names = rows.map((r) => r.index).filter(Boolean);

      // Dedupe + sort for stable UX
      const indices = Array.from(new Set(names)).sort();

      return res.ok({ body: { ok: true, indices } });
    } catch (err) {
      // Still return ok=false (UI will just have no suggestions)
      // eslint-disable-next-line no-console
      console.error('Alerting - MonitorService - listIndices:', err);
      return res.ok({ body: { ok: false, indices: [], resp: err?.message } });
    }
  };

  createMonitor = async (context, req, res) => {
    try {
      const params = { body: req.body };
      const client = this.getClientBasedOnDataSource(context, req);
      const createResponse = await client('alerting.createMonitor', params);
      return res.ok({ body: { ok: true, resp: createResponse } });
    } catch (err) {
      console.error('Alerting - MonitorService - createMonitor:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  alertsForMonitorsV2 = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
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
      // If the data source cluster doesn't support v2 alerts endpoint, try the default cluster
      if (isNoHandlerError(err) && req.query?.dataSourceId) {
        try {
          console.warn(
            '[alertsForMonitorsV2] Data source cluster does not support v2 alerts, falling back to default cluster'
          );

          // Get client without data source routing (use default cluster)
          const defaultClient = this.osDriver.asScoped(req).callAsCurrentUser;
          const backendQuery = this.normalizeAlertsQuery(req.query);
          const fallbackPath = this.buildAlertsPath(backendQuery);

          const resp = await defaultClient('transport.request', {
            method: 'GET',
            path: fallbackPath,
            headers: DEFAULT_HEADERS,
          });

          return res.ok({ body: { ok: true, resp } });
        } catch (fallbackErr) {
          console.error(
            '[alertsForMonitorsV2] Fallback to default cluster also failed:',
            fallbackErr
          );
          // Continue to error handling below
        }
      }

      // If the alerts index doesn't exist yet (no alerts created), return empty result
      if (isIndexNotFoundError(err)) {
        return res.ok({
          body: {
            ok: true,
            resp: { alerts_v2: [], total_alerts_v2: 0 },
          },
        });
      }

      // If endpoint not available and fallback failed, return empty result
      if (isNoHandlerError(err)) {
        console.warn(
          '[alertsForMonitorsV2] v2 alerts endpoint not available, returning empty result'
        );
        return res.ok({
          body: {
            ok: true,
            resp: { alerts_v2: [], total_alerts_v2: 0 },
          },
        });
      }

      console.error('[alertsForMonitorsV2] Unexpected error:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  createPPLMonitor = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    try {
      const client = this.getClientBasedOnDataSource(context, req);

      // Use transport.request for MDS/AOSS compatibility (named endpoints don't work with data sources)
      const createResponse = await client('transport.request', {
        method: 'POST',
        path: '/_plugins/_alerting/v2/monitors',
        body: req.body,
        headers: DEFAULT_HEADERS,
      });

      return res.ok({ body: { ok: true, resp: createResponse } });
    } catch (err) {
      console.error('Alerting - MonitorService - createPPLMonitor:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  updatePPLMonitor = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      const id = req.params.id;
      const ifSeqNo = req.query?.if_seq_no;
      const ifPrimaryTerm = req.query?.if_primary_term;

      const qs = new URLSearchParams();
      if (Number.isFinite(Number(ifSeqNo))) qs.append('if_seq_no', String(ifSeqNo));
      if (Number.isFinite(Number(ifPrimaryTerm)))
        qs.append('if_primary_term', String(ifPrimaryTerm));
      const path = `/_plugins/_alerting/v2/monitors/${encodeURIComponent(id)}${
        qs.toString() ? `?${qs}` : ''
      }`;

      // Clean backend-managed fields from PPL monitor payload
      let cleanedBody = req.body;
      if (req.body?.ppl_monitor) {
        const {
          enabled_time,
          schema_version,
          last_update_time,
          user,
          id: monitorId,
          ...cleanMonitor
        } = req.body.ppl_monitor;

        // Also clean backend-managed fields from triggers
        if (Array.isArray(cleanMonitor.triggers)) {
          cleanMonitor.triggers = cleanMonitor.triggers.map(
            ({ id, last_triggered_time, ...trigger }) => trigger
          );
        }

        cleanedBody = { ppl_monitor: cleanMonitor };
      }

      const resp = await client('transport.request', {
        method: 'PUT',
        path,
        body: cleanedBody,
        headers: DEFAULT_HEADERS,
      });
      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      console.error('Alerting - MonitorService - updatePPLMonitor:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  getPPLMonitor = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    try {
      const id = req.params.id;
      const client = this.getClientBasedOnDataSource(context, req);

      // Use transport.request for MDS/AOSS compatibility
      const raw = await client('transport.request', {
        method: 'GET',
        path: `/_plugins/_alerting/v2/monitors/${encodeURIComponent(id)}`,
        headers: DEFAULT_HEADERS,
      });

      const monitor =
        _.get(raw, 'monitor_v2.ppl_monitor') ||
        _.get(raw, 'ppl_monitor') ||
        _.get(raw, 'monitor') ||
        _.get(raw, '_source') ||
        {};

      // Normalize for UI safety
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
      console.error('Alerting - MonitorService - getPPLMonitor:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  deletePPLMonitor = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    console.log('delete api called. req:', req);
    try {
      const id = req.params.id;
      const client = this.getClientBasedOnDataSource(context, req);

      // Use transport.request for MDS/AOSS compatibility
      const resp = await client('transport.request', {
        method: 'DELETE',
        path: `/_plugins/_alerting/v2/monitors/${encodeURIComponent(id)}`,
        headers: DEFAULT_HEADERS,
      });

      console.log('response:', resp);
      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      console.error('Alerting - MonitorService - deletePPLMonitor:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  executePPLMonitorById = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    try {
      const id = req.params.id;
      const client = this.getClientBasedOnDataSource(context, req);

      // Use transport.request for MDS/AOSS compatibility
      const resp = await client('transport.request', {
        method: 'POST',
        path: `/_plugins/_alerting/v2/monitors/${encodeURIComponent(id)}/_execute`,
        body: req.body,
        headers: DEFAULT_HEADERS,
      });

      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      console.error('Alerting - MonitorService - executePPLMonitorById:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  executePPLMonitor = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    try {
      const client = this.getClientBasedOnDataSource(context, req);

      // Use transport.request for MDS/AOSS compatibility
      const resp = await client('transport.request', {
        method: 'POST',
        path: '/_plugins/_alerting/v2/monitors/_execute',
        body: req.body,
        headers: DEFAULT_HEADERS,
      });

      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      console.error('Alerting - MonitorService - executePPLMonitor:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  alertsPPLMonitor = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      // Extract UI params
      const {
        from = 0,
        size = 50,
        sortField = 'start_time',
        sortDirection = 'desc',
        search = '',
        severityLevel = 'ALL',
        alertState = 'ALL',
        monitorIds,
      } = req.query || {};

      // Normalize monitorIds -> array
      const ids = Array.isArray(monitorIds)
        ? monitorIds
        : typeof monitorIds === 'string' && monitorIds.length
        ? monitorIds
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      // If the cluster has the new per-monitor endpoint, call it per id and merge.
      if (ids.length) {
        const all = [];
        for (const id of ids) {
          try {
            // The new API you added: GET /_plugins/_alerting/v2/monitors/alerts?monitor_id=...
            const qs = new URLSearchParams({ monitorId: id }).toString();
            const path = `/_plugins/_alerting/v2/monitors/alerts?${qs}`;
            const r = await client('transport.request', {
              method: 'GET',
              path,
              headers: DEFAULT_HEADERS,
            });
            const alerts = r?.alerts || r?.body?.alerts || [];
            for (const a of alerts) {
              // annotate so UI columns have monitor id/name if needed
              a.monitor_id = a.monitor_id || id;
              all.push(a);
            }
          } catch (e) {
            // If this endpoint is missing for some reason, continue; we’ll fall back later.
            if (!isNoHandlerError(e)) throw e;
          }
        }

        if (all.length) {
          // Filter by state / severity / search (very light client-side filter)
          const filtered = all.filter((a) => {
            const stateOk =
              alertState === 'ALL'
                ? true
                : String(a.state).toUpperCase() === String(alertState).toUpperCase();
            const sevOk =
              severityLevel === 'ALL'
                ? true
                : String(a.severity).toUpperCase() === String(severityLevel).toUpperCase();
            const text = `${a.trigger_name ?? ''} ${a.monitor_name ?? ''} ${
              a.message ?? ''
            }`.toLowerCase();
            const searchOk = !search || text.includes(String(search).toLowerCase());
            return stateOk && sevOk && searchOk;
          });

          // Sort & paginate
          const dir = String(sortDirection).toLowerCase() === 'asc' ? 1 : -1;
          const key = sortField || 'start_time';
          filtered.sort((x, y) => (x[key] === y[key] ? 0 : x[key] > y[key] ? dir : -dir));
          const totalAlerts = filtered.length;
          const page = filtered.slice(
            Number(from) || 0,
            (Number(from) || 0) + (Number(size) || 50)
          );

          return res.ok({ body: { ok: true, alerts: page, totalAlerts } });
        }
      }

      // Fallback 1: old v2 endpoint (if it exists)
      try {
        const qs = new URLSearchParams(
          Object.entries(req.query || {}).reduce((acc, [k, v]) => {
            if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
            return acc;
          }, {})
        ).toString();
        const path = `/_plugins/_alerting/v2/alerts${qs ? `?${qs}` : ''}`;
        const resp = await client('transport.request', {
          method: 'GET',
          path,
          headers: DEFAULT_HEADERS,
        });
        return res.ok({ body: { ok: true, resp } });
      } catch (e2) {
        if (!isNoHandlerError(e2)) throw e2;
      }

      // Fallback 2: query alerts index directly
      const must = [];
      if (ids.length) must.push({ terms: { monitor_id: ids } });
      if (String(alertState).toUpperCase() !== 'ALL')
        must.push({ term: { state: String(alertState).toUpperCase() } });
      if (String(severityLevel).toUpperCase() !== 'ALL')
        must.push({ term: { severity: String(severityLevel).toUpperCase() } });
      if (search) {
        must.push({
          query_string: {
            query: `*${String(search).split(' ').join('* *')}*`,
            default_operator: 'AND',
            fields: ['trigger_name^2', 'monitor_name', 'message', 'error_message'],
          },
        });
      }
      const body = {
        from: Number(from) || 0,
        size: Number(size) || 50,
        sort: [{ [sortField || 'start_time']: { order: sortDirection || 'desc' } }],
        query: { bool: { must: must.length ? must : [{ match_all: {} }] } },
      };

      // Use transport.request for MDS/AOSS compatibility
      const es = await client('transport.request', {
        method: 'POST',
        path: `/${INDEX.ALL_ALERTS}/_search`,
        body,
        headers: DEFAULT_HEADERS,
      });

      const hits = es?.hits?.hits || [];
      const alerts = hits.map((h) => ({ id: h._id, version: h._version, ...(h._source || {}) }));
      const totalAlerts = es?.hits?.total?.value || alerts.length;
      return res.ok({ body: { ok: true, alerts, totalAlerts } });
    } catch (err) {
      console.error('Alerting - MonitorService - alertsPPLMonitor:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  createWorkflow = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    try {
      const params = { body: req.body };
      const client = this.getClientBasedOnDataSource(context, req);
      const resp = await client('alerting.createWorkflow', params);
      return res.ok({ body: { ok: true, resp: resp } });
    } catch (err) {
      console.error('Alerting - MonitorService - createWorkflow:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  deleteMonitor = async (context, req, res) => {
    const pplEnabled = await this.isPplMonitorEnabled(req);
    if (!pplEnabled) {
      return this.deleteLegacyMonitor(context, req, res);
    }
    try {
      const { id } = req.params;
      console.log('Deleting monitor id: ', id);
      const client = this.getClientBasedOnDataSource(context, req);

      // Use the v2 DELETE API as specified
      const resp = await client('transport.request', {
        method: 'DELETE',
        path: `/_plugins/_alerting/v2/monitors/${encodeURIComponent(id)}`,
        headers: DEFAULT_HEADERS,
      });

      console.log('v2 delete succeeded:', resp);

      // v2 API returns 204 No Content on success
      return res.ok({ body: { ok: true, resp } });
    } catch (err) {
      console.error('Alerting - MonitorService - deleteMonitor error:', err);

      // If the monitor belongs to V1, fall back to legacy API
      if (isLegacyMonitorDeleteError(err)) {
        return this.deleteLegacyMonitor(context, req, res);
      }

      // Check if it's a 404 (monitor doesn't exist)
      if (err.statusCode === 404 || err.body?.status === 404) {
        return res.ok({ body: { ok: false, resp: 'Monitor not found' } });
      }

      return res.ok({ body: { ok: false, resp: err.message || err.toString() } });
    }
  };

  deleteLegacyMonitor = async (context, req, res) => {
    try {
      const { id } = req.params;
      const client = this.getClientBasedOnDataSource(context, req);
      const params = { monitorId: id };
      const version = req.query?.version;
      if (version !== undefined) {
        params.version = version;
      }

      const legacyResp = await client('alerting.deleteMonitor', params);
      return res.ok({ body: { ok: true, resp: legacyResp } });
    } catch (legacyErr) {
      console.error('Alerting - MonitorService - legacy delete fallback failed:', legacyErr);
      return res.ok({
        body: { ok: false, resp: legacyErr.message || legacyErr.toString?.() || legacyErr },
      });
    }
  };

  deleteWorkflow = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    try {
      const { id } = req.params;
      const params = { workflowId: id };
      const client = this.getClientBasedOnDataSource(context, req);
      const response = await client('alerting.deleteWorkflow', params);
      return res.ok({
        body: { ok: response.result === 'deleted' || response.result === undefined },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - deleteWorkflow:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  getMonitor = async (context, req, res) => {
    const pplEnabled = await this.isPplMonitorEnabled(req);
    try {
      const { id } = req.params;
      const client = this.getClientBasedOnDataSource(context, req);

      if (pplEnabled) {
        // 1) Try v2 GET
        try {
          const v2 = await client('transport.request', {
            method: 'GET',
            path: `/_plugins/_alerting/v2/monitors/${encodeURIComponent(id)}`,
            headers: DEFAULT_HEADERS,
          });
          let monitor =
            _.get(v2, 'monitor_v2.ppl_monitor') ||
            _.get(v2, 'ppl_monitor') ||
            _.get(v2, 'monitor') ||
            _.get(v2, '_source') ||
            null;

          if (monitor) {
            // Default monitor_type for v2 docs (UI expects it)
            if (!monitor.monitor_type) monitor.monitor_type = 'query_level';

            // Aggregations from alerts index
            const aggsParams = {
              index: INDEX.ALL_ALERTS,
              body: {
                size: 0,
                query: { bool: { must: { term: { monitor_id: id } } } },
                aggs: {
                  active_count: { terms: { field: 'state' } },
                  '24_hour_count': {
                    date_range: { field: 'start_time', ranges: [{ from: 'now-24h/h' }] },
                  },
                },
              },
            };

            // Use transport.request for MDS/AOSS compatibility
            const searchResponse = await client('transport.request', {
              method: 'POST',
              path: `/${INDEX.ALL_ALERTS}/_search`,
              body: aggsParams.body,
              headers: DEFAULT_HEADERS,
            });

            const dayCount = _.get(
              searchResponse,
              'aggregations.24_hour_count.buckets.0.doc_count',
              0
            );
            const activeBuckets = _.get(searchResponse, 'aggregations.active_count.buckets', []);
            const activeCount = activeBuckets.reduce(
              (acc, curr) => (curr.key === 'ACTIVE' ? curr.doc_count : acc),
              0
            );

            // normalize so UI doesn't choke AND preserve legacy fields the UI expects
            monitor = {
              ...monitor,
              item_type: monitor.workflow_type || monitor.monitor_type || 'query_level',
              monitor_type: monitor.monitor_type || 'query_level',
              id, // new world
              _id: id, // legacy field
              version: _.get(v2, '_version', null),
              _version: _.get(v2, '_version', null), // legacy field
              _seq_no: _.get(v2, '_seq_no', null), // legacy field
              _primary_term: _.get(v2, '_primary_term', null), // legacy field
            };
            monitor.triggers = Array.isArray(monitor.triggers) ? monitor.triggers : [];
            monitor.ui_metadata = monitor.ui_metadata || {};
            monitor.ui_metadata.triggers = monitor.ui_metadata.triggers || {};

            return res.ok({
              body: {
                ok: true,
                resp: monitor,
                activeCount,
                dayCount,
                version: _.get(v2, '_version', null),
                ifSeqNo: _.get(v2, '_seq_no', null),
                ifPrimaryTerm: _.get(v2, '_primary_term', null),
              },
            });
          }
        } catch (e) {
          // continue
        }

        // 2) No v2 doc — try to read from v2 _search by _id (works even if legacy GET is absent)
        try {
          const search = await client('transport.request', {
            method: 'POST',
            path: '/_plugins/_alerting/v2/monitors/_search',
            body: {
              query: { ids: { values: [id] } },
              version: true,
              seq_no_primary_term: true,
              size: 1,
            },
            headers: DEFAULT_HEADERS,
          });

          const hit = _.get(search, 'hits.hits[0]');
          if (hit) {
            let monitor = (hit._source?.monitor || hit._source) ?? {};
            const version = hit._version;
            const ifSeqNo = hit._seq_no;
            const ifPrimaryTerm = hit._primary_term;

            // Extract PPL monitor if present (nested in monitor_v2.ppl_monitor)
            const pplMonitor = monitor?.monitor_v2?.ppl_monitor || monitor?.ppl_monitor;
            if (pplMonitor) {
              monitor = {
                ...monitor,
                ...pplMonitor, // Spread PPL monitor fields to top level
                monitor_v2: monitor.monitor_v2, // Preserve original nested structure
              };
            }

            // Default for v2 docs
            if (!monitor.monitor_type) monitor.monitor_type = 'query_level';

            const aggsParams = {
              index: INDEX.ALL_ALERTS,
              body: {
                size: 0,
                query: { terms: { monitor_id: [id] } },
                aggs: {
                  active_count: { terms: { field: 'state' } },
                  '24_hour_count': {
                    date_range: { field: 'start_time', ranges: [{ from: 'now-24h/h' }] },
                  },
                },
              },
            };

            // Use transport.request for MDS/AOSS compatibility
            const searchResponse = await client('transport.request', {
              method: 'POST',
              path: `/${INDEX.ALL_ALERTS}/_search`,
              body: aggsParams.body,
              headers: DEFAULT_HEADERS,
            });

            const dayCount = _.get(
              searchResponse,
              'aggregations.24_hour_count.buckets.0.doc_count',
              0
            );
            const activeBuckets = _.get(searchResponse, 'aggregations.active_count.buckets', []);
            const activeCount = activeBuckets.reduce(
              (acc, curr) => (curr.key === 'ACTIVE' ? curr.doc_count : acc),
              0
            );

            // normalize triggers & ui_metadata for UI safety
            const safe = {
              ...monitor,
              item_type: monitor.workflow_type || monitor.monitor_type || 'query_level',
              monitor_type: monitor.monitor_type || 'query_level',
              id,
              _id: id,
              version,
              _version: version,
              _seq_no: ifSeqNo,
              _primary_term: ifPrimaryTerm,
            };
            safe.triggers = Array.isArray(safe.triggers) ? safe.triggers : [];
            safe.ui_metadata = safe.ui_metadata || {};
            safe.ui_metadata.triggers = safe.ui_metadata.triggers || {};

            return res.ok({
              body: {
                ok: true,
                resp: safe,
                activeCount,
                dayCount,
                version,
                ifSeqNo,
                ifPrimaryTerm,
              },
            });
          }
        } catch (e) {
          // continue
        }
      }

      // 3) Legacy GET only if legacy API exists
      try {
        const params = { monitorId: id, headers: DEFAULT_HEADERS };
        const legacy = await client('alerting.getMonitor', params);
        const monitor = _.get(legacy, 'monitor', null);
        if (!monitor) return res.ok({ body: { ok: false } });

        const version = _.get(legacy, '_version', null);
        const ifSeqNo = _.get(legacy, '_seq_no', null);
        const ifPrimaryTerm = _.get(legacy, '_primary_term', null);

        const safe = {
          ...monitor,
          item_type: monitor.workflow_type || monitor.monitor_type,
          id,
          version,
        };
        safe.triggers = Array.isArray(safe.triggers) ? safe.triggers : [];
        safe.ui_metadata = safe.ui_metadata || {};
        safe.ui_metadata.triggers = safe.ui_metadata.triggers || {};

        return res.ok({
          body: {
            ok: true,
            resp: safe,
            activeCount: 0,
            dayCount: 0,
            version,
            ifSeqNo,
            ifPrimaryTerm,
          },
        });
      } catch (e) {
        if (isNoHandlerError(e)) {
          return res.ok({ body: { ok: false, resp: 'Alerting legacy endpoint not available' } });
        }
        throw e;
      }
    } catch (err) {
      console.error('Alerting - MonitorService - getMonitor:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  getWorkflow = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.pplFeatureDisabled(res);
    }
    try {
      const { id } = req.params;
      const params = { monitorId: id };
      const client = this.getClientBasedOnDataSource(context, req);
      const getResponse = await client('alerting.getWorkflow', params);
      let workflow = _.get(getResponse, 'workflow', null);
      const version = _.get(getResponse, '_version', null);
      const ifSeqNo = _.get(getResponse, '_seq_no', null);
      const ifPrimaryTerm = _.get(getResponse, '_primary_term', null);
      workflow.monitor_type = workflow.workflow_type;
      workflow = { ...workflow, item_type: workflow.workflow_type, id, version };

      return res.ok({
        body: {
          ok: true,
          resp: workflow,
          activeCount: 0,
          dayCount: 0,
          version,
          ifSeqNo,
          ifPrimaryTerm,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - getWorkflow:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  updateMonitor = async (context, req, res) => {
    try {
      const { id } = req.params;
      const client = this.getClientBasedOnDataSource(context, req);

      // Route to v2 update if payload is v2/PPL
      if (isV2MonitorPayload(req.body)) {
        let cleanedBody = req.body;
        if (req.body?.ppl_monitor) {
          const { enabled_time, schema_version, last_update_time, user, ...cleanMonitor } =
            req.body.ppl_monitor;

          if (Array.isArray(cleanMonitor.triggers)) {
            cleanMonitor.triggers = cleanMonitor.triggers.map(
              ({ id, last_triggered_time, ...trigger }) => trigger
            );
          }

          cleanedBody = { ppl_monitor: cleanMonitor };
        }

        const ifSeqNo = req.query?.ifSeqNo;
        const ifPrimaryTerm = req.query?.ifPrimaryTerm;
        const qs = new URLSearchParams();
        if (Number.isFinite(Number(ifSeqNo))) qs.append('if_seq_no', String(ifSeqNo));
        if (Number.isFinite(Number(ifPrimaryTerm)))
          qs.append('if_primary_term', String(ifPrimaryTerm));

        const resp = await client('transport.request', {
          method: 'PUT',
          path: `/_plugins/_alerting/v2/monitors/${encodeURIComponent(id)}${
            qs.toString() ? `?${qs}` : ''
          }`,
          body: cleanedBody,
          headers: DEFAULT_HEADERS,
        });

        console.log('resp: ', resp);
        const { _version, _id } = resp || {};
        return res.ok({ body: { ok: true, version: _version, id: _id || id } });
      }
      console.log('went to legacy update');

      // Legacy path (only if available)
      const params = { monitorId: id, body: req.body, refresh: 'wait_for' };
      const { ifSeqNo, ifPrimaryTerm } = req.query;
      if (ifSeqNo && ifPrimaryTerm) {
        params.if_seq_no = ifSeqNo;
        params.if_primary_term = ifPrimaryTerm;
      }
      const type = req.body?.type;
      const resp = await client(
        `alerting.${type === 'workflow' ? 'updateWorkflow' : 'updateMonitor'}`,
        params
      );
      const { _version, _id } = resp || {};
      return res.ok({ body: { ok: true, version: _version, id: _id || id } });
    } catch (err) {
      if (isNoHandlerError(err)) {
        return res.ok({ body: { ok: false, resp: 'Alerting legacy endpoint not available' } });
      }
      console.error('Alerting - MonitorService - updateMonitor:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  getMonitors = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.getMonitorsV1(context, req, res);
    }
    try {
      const { from, size, search, sortDirection, sortField, state, monitorIds } = req.query;

      let must = { match_all: {} };
      if (search.trim()) {
        must = {
          query_string: {
            fields: [
              'monitor.name', // Legacy monitors
              'ppl_monitor.name', // PPL monitors (direct)
              'monitor_v2.ppl_monitor.name', // PPL monitors (wrapped v2)
              'workflow.name', // Workflow monitors
            ],
            default_operator: 'AND',
            query: `*${search.trim().split(' ').join('* *')}*`,
          },
        };
      }

      const should = [];
      const mustList = [must];

      if (monitorIds !== undefined) {
        mustList.push({ terms: { _id: Array.isArray(monitorIds) ? monitorIds : [monitorIds] } });
      } else if (monitorIds === 'empty') {
        mustList.push({ terms: { _id: [] } });
      }

      if (state !== 'all') {
        const enabled = state === 'enabled';
        should.push({ term: { 'monitor.enabled': enabled } });
        should.push({ term: { 'workflow.enabled': enabled } });
      }

      const monitorSorts = { name: 'monitor.name.keyword' };
      const monitorSortPageData = { size: 1000 };
      if (monitorSorts[sortField]) {
        monitorSortPageData.sort = [{ [monitorSorts[sortField]]: sortDirection }];
        monitorSortPageData.size = _.defaultTo(size, 1000);
        monitorSortPageData.from = _.defaultTo(from, 0);
      }

      const params = {
        body: {
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
              nested: { path: 'workflow.inputs.composite_input.sequence.delegates' },
              aggs: {
                monitor_ids: {
                  terms: { field: 'workflow.inputs.composite_input.sequence.delegates.monitor_id' },
                },
              },
            },
          },
        },
      };

      const client = this.getClientBasedOnDataSource(context, req);

      // v2 search for monitors - use transport.request for MDS/AOSS compatibility
      const getResponse = await client('transport.request', {
        method: 'POST',
        path: '/_plugins/_alerting/v2/monitors/_search',
        body: params.body,
        headers: DEFAULT_HEADERS,
      });

      // Filter out metadata documents before processing
      const allHits = _.get(getResponse, 'hits.hits', []);
      const filteredHits = allHits.filter((result) => {
        const id = result._id;
        const monitor = result._source?.monitor || result._source || {};
        // Exclude if ID ends with -metadata OR if it has a metadata field
        return !id.endsWith('-metadata') && !monitor.metadata;
      });

      const totalMonitors = filteredHits.length;
      const monitorKeyValueTuples = filteredHits.map((result) => {
        const {
          _id: id,
          _version: version,
          _seq_no: ifSeqNo,
          _primary_term: ifPrimaryTerm,
          _source,
        } = result;

        // v2 wraps under _source.monitor; legacy is flat
        let monitor = _source?.monitor ? _source.monitor : _source || {};

        // Extract PPL monitor if present (nested in monitor_v2.ppl_monitor)
        const pplMonitor = monitor?.monitor_v2?.ppl_monitor || monitor?.ppl_monitor;
        if (pplMonitor) {
          // Use the nested PPL monitor data but keep the wrapper for compatibility
          monitor = {
            ...monitor,
            ...pplMonitor, // Spread PPL monitor fields to top level
            monitor_v2: monitor.monitor_v2, // Preserve original nested structure
          };
        }

        // ------- Normalize for UI -------
        // v2 docs don't have monitor_type; the UI expects it to render the Type column.
        if (!monitor.monitor_type) {
          monitor.monitor_type = 'query_level';
        }
        // item_type is used throughout the UI in actions/routing
        const item_type = monitor.workflow_type || monitor.monitor_type || 'query_level';

        // Ensure triggers array exists
        if (!Array.isArray(monitor.triggers)) monitor.triggers = [];

        const name = monitor.name || id; // guarantee a name for the table
        const enabled = !!monitor.enabled;
        // --------------------------------

        return [id, { id, version, ifSeqNo, ifPrimaryTerm, name, enabled, item_type, monitor }];
      }, {});
      const monitorMap = new Map(monitorKeyValueTuples);
      const associatedCompositeMonitorCountMap = {};
      _.get(
        getResponse,
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
      if (aggsSorts[sortField]) aggsOrderData.order = { [aggsSorts[sortField]]: sortDirection };

      const aggsParams = {
        index: INDEX.ALL_ALERTS,
        body: {
          size: 0,
          query: { terms: { monitor_id: monitorIdsOutput } },
          aggregations: {
            uniq_monitor_ids: {
              terms: { field: 'monitor_id', ...aggsOrderData, size: from + size },
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
        },
      };

      // Use transport.request for MDS/AOSS compatibility
      const esAggsResponse = await client('transport.request', {
        method: 'POST',
        path: `/${INDEX.ALL_ALERTS}/_search`,
        body: aggsParams.body,
        headers: DEFAULT_HEADERS,
      });

      const buckets = _.get(esAggsResponse, 'aggregations.uniq_monitor_ids.buckets', []).map(
        (bucket) => {
          const {
            key: id,
            last_notification_time: { value: lastNotificationTime },
            ignored: { doc_count: ignored },
            acknowledged: { doc_count: acknowledged },
            active: { doc_count: active },
            errors: { doc_count: errors },
            latest_alert: {
              hits: {
                hits: [
                  {
                    _source: { trigger_name: latestAlert },
                  },
                ],
              },
            },
          } = bucket;
          const monitor = monitorMap.get(id);
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
        }
      );

      const unusedMonitors = [...monitorMap.values()].map((row) => ({
        ...row, // contains id, version, ifSeqNo, ifPrimaryTerm, name, enabled, item_type, monitor
        lastNotificationTime: null,
        ignored: 0,
        active: 0,
        acknowledged: 0,
        errors: 0,
        latestAlert: '--',
        currentTime: Date.now(),
        associatedCompositeMonitorCnt: associatedCompositeMonitorCountMap[row.id] || 0,
      }));

      let results = _.orderBy(buckets.concat(unusedMonitors), [sortField], [sortDirection]);
      if (!monitorSorts[sortField]) results = results.slice(from, from + size);

      return res.ok({ body: { ok: true, monitors: results, totalMonitors } });
    } catch (err) {
      if (isIndexNotFoundError(err)) {
        return res.ok({
          body: {
            ok: false,
            resp: { totalMonitors: 0, monitors: [], message: 'No monitors created' },
          },
        });
      } else {
        console.error('Alerting - MonitorService - getMonitors', err);
        return res.ok({ body: { ok: false, resp: err.message } });
      }
    }
  };

  acknowledgeAlerts = async (context, req, res) => {
    try {
      const { id } = req.params;
      const params = { monitorId: id, body: req.body };
      const client = this.getClientBasedOnDataSource(context, req);
      const acknowledgeResponse = await client('alerting.acknowledgeAlerts', params);
      return res.ok({
        body: { ok: !acknowledgeResponse.failed.length, resp: acknowledgeResponse },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - acknowledgeAlerts:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  acknowledgeChainedAlerts = async (context, req, res) => {
    try {
      const { id } = req.params;
      const params = { workflowId: id, body: req.body };
      const client = this.getClientBasedOnDataSource(context, req);
      const resp = await client('alerting.acknowledgeChainedAlerts', params);
      return res.ok({ body: { ok: !resp.failed.length, resp } });
    } catch (err) {
      console.error('Alerting - MonitorService - acknowledgeChainedAlerts:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  executeMonitor = async (context, req, res) => {
    try {
      const { dryrun = 'true' } = req.query;
      const client = this.getClientBasedOnDataSource(context, req);
      console.log('hit this inline:', req.body);
      const pplEnabled = await this.isPplMonitorEnabled(req);
      // route to v2 when body is PPL/v2
      if (isV2MonitorPayload(req.body)) {
        if (!pplEnabled) {
          return this.pplFeatureDisabled(res);
        }
        // Use transport.request for MDS/AOSS compatibility
        const v2Resp = await client('transport.request', {
          method: 'POST',
          path: '/_plugins/_alerting/v2/monitors/_execute',
          body: req.body,
          headers: DEFAULT_HEADERS,
        });

        return res.ok({ body: { ok: true, resp: v2Resp } });
      }

      // Legacy execute (only if legacy API exists)
      const params = { body: req.body, dryrun };
      const executeResponse = await client('alerting.executeMonitor', params);
      return res.ok({ body: { ok: true, resp: executeResponse } });
    } catch (err) {
      if (isNoHandlerError(err)) {
        return res.ok({ body: { ok: false, resp: 'Alerting legacy endpoint not available' } });
      }
      console.error('Alerting - MonitorService - executeMonitor:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };

  // v2 pass-through (kept)
  searchMonitorsV2 = async (context, req, res) => {
    if (!(await this.isPplMonitorEnabled(req))) {
      return this.searchMonitors(context, req, res);
    }
    try {
      const client = this.getClientBasedOnDataSource(context, req);

      // Use transport.request for MDS/AOSS compatibility
      const results = await client('transport.request', {
        method: 'POST',
        path: '/_plugins/_alerting/v2/monitors/_search',
        body: req.body?.query ?? req.body,
        headers: DEFAULT_HEADERS,
      });

      return res.ok({ body: { ok: true, resp: results } });
    } catch (err) {
      if (isIndexNotFoundError(err)) {
        return res.ok({
          body: {
            ok: false,
            resp: { totalMonitors: 0, monitors: [], message: 'No monitors created' },
          },
        });
      } else {
        console.error('Alerting - MonitorService - searchMonitorsV2:', err);
        return res.ok({ body: { ok: false, resp: err.message } });
      }
    }
  };

  // Legacy passthrough (generic ES search)
  searchMonitors = async (context, req, res) => {
    try {
      const { query, index, size } = req.body;

      const client = this.getClientBasedOnDataSource(context, req);

      // Use transport.request for MDS/AOSS compatibility
      const results = await client('transport.request', {
        method: 'POST',
        path: `/${index}/_search`,
        body: { ...query, size },
        headers: DEFAULT_HEADERS,
      });

      return res.ok({ body: { ok: true, resp: results } });
    } catch (err) {
      if (isIndexNotFoundError(err)) {
        return res.ok({
          body: {
            ok: false,
            resp: { totalMonitors: 0, monitors: [], message: 'No monitors created' },
          },
        });
      } else {
        console.error('Alerting - MonitorService - searchMonitor:', err);
        return res.ok({ body: { ok: false, resp: err.message } });
      }
    }
  };

  // Get v1 (classic/legacy) monitors only - excludes v2 PPL monitors
  getMonitorsV1 = async (context, req, res) => {
    try {
      const { from, size, search, sortDirection, sortField, state, monitorIds } = req.query;

      let must = { match_all: {} };
      if (search.trim()) {
        must = {
          query_string: {
            default_field: 'monitor.name',
            default_operator: 'AND',
            query: `*${search.trim().split(' ').join('* *')}*`,
          },
        };
      }

      const should = [];
      const mustList = [must];

      // Exclude v2 monitors by filtering out documents with monitor_v2 or ppl_monitor
      mustList.push({
        bool: {
          must_not: [
            { exists: { field: 'monitor.monitor_v2' } },
            { exists: { field: 'monitor.ppl_monitor' } },
            { exists: { field: 'ppl_monitor' } },
            { exists: { field: 'monitor_v2' } },
          ],
        },
      });

      if (monitorIds !== undefined) {
        mustList.push({ terms: { _id: Array.isArray(monitorIds) ? monitorIds : [monitorIds] } });
      } else if (monitorIds === 'empty') {
        mustList.push({ terms: { _id: [] } });
      }

      if (state !== 'all') {
        const enabled = state === 'enabled';
        should.push({ term: { 'monitor.enabled': enabled } });
        should.push({ term: { 'workflow.enabled': enabled } });
      }

      const monitorSorts = { name: 'monitor.name.keyword' };
      const monitorSortPageData = { size: 1000 };
      if (monitorSorts[sortField]) {
        monitorSortPageData.sort = [{ [monitorSorts[sortField]]: sortDirection }];
        monitorSortPageData.size = _.defaultTo(size, 1000);
        monitorSortPageData.from = _.defaultTo(from, 0);
      }

      const params = {
        body: {
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
              nested: { path: 'workflow.inputs.composite_input.sequence.delegates' },
              aggs: {
                monitor_ids: {
                  terms: { field: 'workflow.inputs.composite_input.sequence.delegates.monitor_id' },
                },
              },
            },
          },
        },
      };

      const client = this.getClientBasedOnDataSource(context, req);

      // Use direct ES search for v1 monitors (searches .opendistro-alerting-config index)
      // Use transport.request for MDS/AOSS compatibility
      const getResponse = await client('transport.request', {
        method: 'POST',
        path: `/${INDEX.SCHEDULED_JOBS}/_search`,
        body: params.body,
        headers: DEFAULT_HEADERS,
      });

      // Filter out metadata documents before processing
      const allHits = _.get(getResponse, 'hits.hits', []);
      const filteredHits = allHits.filter((result) => {
        const id = result._id;
        const monitor = result._source?.monitor || result._source || {};
        // Exclude if ID ends with -metadata OR if it has a metadata field
        return !id.endsWith('-metadata') && !monitor.metadata;
      });

      const totalMonitors = filteredHits.length;
      const monitorKeyValueTuples = filteredHits.map((result) => {
        const {
          _id: id,
          _version: version,
          _seq_no: ifSeqNo,
          _primary_term: ifPrimaryTerm,
          _source,
        } = result;

        // v1 monitors are stored flat in _source.monitor
        const monitor = _source?.monitor || _source || {};

        const item_type = monitor.workflow_type || monitor.monitor_type || 'query_level';
        const name = monitor.name || id;
        const enabled = !!monitor.enabled;

        if (!Array.isArray(monitor.triggers)) monitor.triggers = [];

        return [id, { id, version, ifSeqNo, ifPrimaryTerm, name, enabled, item_type, monitor }];
      });

      const monitorMap = new Map(monitorKeyValueTuples);
      const associatedCompositeMonitorCountMap = {};
      _.get(
        getResponse,
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
      if (aggsSorts[sortField]) aggsOrderData.order = { [aggsSorts[sortField]]: sortDirection };

      const aggsParams = {
        index: INDEX.ALL_ALERTS,
        body: {
          size: 0,
          query: { terms: { monitor_id: monitorIdsOutput } },
          aggregations: {
            uniq_monitor_ids: {
              terms: { field: 'monitor_id', ...aggsOrderData, size: from + size },
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
                    _source: { includes: ['monitor_name', 'trigger_name'] },
                  },
                },
              },
            },
          },
        },
      };

      // Use transport.request for MDS/AOSS compatibility
      const aggsResponse = await client('transport.request', {
        method: 'POST',
        path: `/${INDEX.ALL_ALERTS}/_search`,
        body: aggsParams.body,
        headers: DEFAULT_HEADERS,
      }).catch((err) => {
        if (isIndexNotFoundError(err)) {
          console.log(
            `Alerting - MonitorService - getMonitorsV1 - alerts index not found:`,
            INDEX.ALL_ALERTS
          );
          return { aggregations: { uniq_monitor_ids: { buckets: [] } } };
        }
        throw err;
      });

      const buckets = _.get(aggsResponse, 'aggregations.uniq_monitor_ids.buckets', []);
      buckets.forEach((bucket) => {
        const {
          key: monitorId,
          active: { doc_count: active } = {},
          acknowledged: { doc_count: acknowledged } = {},
          errors: { doc_count: errors } = {},
          ignored: { doc_count: ignored } = {},
          last_notification_time: {
            value: lastNotificationTime,
            value_as_string: lastNotificationTimeString,
          } = {},
          latest_alert: { hits: { hits: latestAlert = [] } = {} } = {},
        } = bucket;

        const latestAlertHit = _.get(latestAlert, '[0]._source', {});
        const monitor = monitorMap.get(monitorId);
        if (monitor) {
          monitor.latestAlert = latestAlertHit.start_time;
          monitor.active = active;
          monitor.lastNotificationTime = lastNotificationTimeString || lastNotificationTime;
          monitor.acknowledged = acknowledged;
          monitor.currentTime = Date.now();
          monitor.errors = errors;
          monitor.ignored = ignored;
          monitor.associatedCompositeMonitorCnt =
            associatedCompositeMonitorCountMap[monitorId] ?? 0;
        }
      });

      let monitors = monitorIdsOutput.map((id) => monitorMap.get(id));

      if (sortField && aggsSorts[sortField]) {
        monitors = _.orderBy(
          monitors,
          [
            (m) =>
              aggsSorts[sortField] === 'last_notification_time'
                ? m.lastNotificationTime
                : m[aggsSorts[sortField]],
          ],
          [sortDirection]
        );
        monitors = monitors.slice(from, from + size);
      }

      return res.ok({ body: { ok: true, monitors, totalMonitors } });
    } catch (err) {
      console.error('Alerting - MonitorService - getMonitorsV1:', err);
      return res.ok({ body: { ok: false, resp: err.message } });
    }
  };
}
