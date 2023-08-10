/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';

import { INDEX } from '../../utils/constants';
import { isIndexNotFoundError } from './utils/helpers';

export default class MonitorService {
  constructor(esDriver) {
    this.esDriver = esDriver;
  }

  createMonitor = async (context, req, res) => {
    try {
      const params = { body: req.body };
      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const createResponse = await callAsCurrentUser('alerting.createMonitor', params);
      return res.ok({
        body: {
          ok: true,
          resp: createResponse,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - createMonitor:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  createWorkflow = async (context, req, res) => {
    try {
      const params = { body: req.body };
      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const createResponse = await callAsCurrentUser('alerting.createWorkflow', params);
      return res.ok({
        body: {
          ok: true,
          resp: createResponse,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - createWorkflow:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  deleteMonitor = async (context, req, res) => {
    try {
      const { id } = req.params;
      const params = { monitorId: id };
      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const response = await callAsCurrentUser('alerting.deleteMonitor', params);

      return res.ok({
        body: {
          ok: response.result === 'deleted' || response.result === undefined,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - deleteMonitor:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  deleteWorkflow = async (context, req, res) => {
    try {
      const { id } = req.params;
      const params = { workflowId: id };
      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const response = await callAsCurrentUser('alerting.deleteWorkflow', params);

      return res.ok({
        body: {
          ok: response.result === 'deleted' || response.result === undefined,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - deleteWorkflow:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  getMonitor = async (context, req, res) => {
    try {
      const { id } = req.params;
      const params = { monitorId: id };
      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const getResponse = await callAsCurrentUser('alerting.getMonitor', params);
      let monitor = _.get(getResponse, 'monitor', null);
      const version = _.get(getResponse, '_version', null);
      const ifSeqNo = _.get(getResponse, '_seq_no', null);
      const ifPrimaryTerm = _.get(getResponse, '_primary_term', null);
      const associated_workflows = _.get(getResponse, 'associated_workflows', null);
      if (monitor) {
        const { callAsCurrentUser } = this.esDriver.asScoped(req);
        const aggsParams = {
          index: INDEX.ALL_ALERTS,
          body: {
            size: 0,
            query: {
              bool: {
                must: {
                  term: {
                    monitor_id: id,
                  },
                },
              },
            },
            aggs: {
              active_count: {
                terms: {
                  field: 'state',
                },
              },
              '24_hour_count': {
                date_range: {
                  field: 'start_time',
                  ranges: [{ from: 'now-24h/h' }],
                },
              },
            },
          },
        };
        const searchResponse = await callAsCurrentUser('alerting.getMonitors', aggsParams);
        const dayCount = _.get(searchResponse, 'aggregations.24_hour_count.buckets.0.doc_count', 0);
        const activeBuckets = _.get(searchResponse, 'aggregations.active_count.buckets', []);
        const activeCount = activeBuckets.reduce(
          (acc, curr) => (curr.key === 'ACTIVE' ? curr.doc_count : acc),
          0
        );
        if (associated_workflows) {
          monitor = {
            ...monitor,
            associated_workflows,
            associatedCompositeMonitorCnt: associated_workflows.length,
          };
        }
        monitor = {
          ...monitor,
          item_type: monitor.workflow_type || monitor.monitor_type,
          id,
          version,
        };
        return res.ok({
          body: { ok: true, resp: monitor, activeCount, dayCount, version, ifSeqNo, ifPrimaryTerm },
        });
      } else {
        return res.ok({
          body: {
            ok: false,
          },
        });
      }
    } catch (err) {
      console.error('Alerting - MonitorService - getMonitor:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  getWorkflow = async (context, req, res) => {
    try {
      const { id } = req.params;
      const params = { monitorId: id };
      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const getResponse = await callAsCurrentUser('alerting.getWorkflow', params);
      let workflow = _.get(getResponse, 'workflow', null);
      const version = _.get(getResponse, '_version', null);
      const ifSeqNo = _.get(getResponse, '_seq_no', null);
      const ifPrimaryTerm = _.get(getResponse, '_primary_term', null);
      workflow.monitor_type = workflow.workflow_type;
      workflow = {
        ...workflow,
        item_type: workflow.workflow_type,
        id,
        version,
      };

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
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  updateMonitor = async (context, req, res) => {
    try {
      const { id } = req.params;
      const params = { monitorId: id, body: req.body, refresh: 'wait_for' };
      const { type } = req.body;

      // TODO DRAFT: Are we sure we need to include ifSeqNo and ifPrimaryTerm from the UI side when updating monitors?
      const { ifSeqNo, ifPrimaryTerm } = req.query;
      if (ifSeqNo && ifPrimaryTerm) {
        params.if_seq_no = ifSeqNo;
        params.if_primary_term = ifPrimaryTerm;
      }

      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const updateResponse = await callAsCurrentUser(
        `alerting.${type === 'workflow' ? 'updateWorkflow' : 'updateMonitor'}`,
        params
      );
      const { _version, _id } = updateResponse;
      return res.ok({
        body: {
          ok: true,
          version: _version,
          id: _id,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - updateMonitor:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  getMonitors = async (context, req, res) => {
    try {
      const { from, size, search, sortDirection, sortField, state, monitorIds } = req.query;

      let must = { match_all: {} };
      if (search.trim()) {
        // This is an expensive wildcard query to match monitor names such as: "This is a long monitor name"
        // search query => "long monit"
        // This is acceptable because we will never allow more than 1,000 monitors
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
      if (monitorIds !== undefined) {
        mustList.push({
          terms: {
            _id: Array.isArray(monitorIds) ? monitorIds : [monitorIds],
          },
        });
      } else if (monitorIds === 'empty') {
        mustList.push({
          terms: {
            _id: [],
          },
        });
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
        },
      };

      const { callAsCurrentUser: alertingCallAsCurrentUser } = await this.esDriver.asScoped(req);
      const getResponse = await alertingCallAsCurrentUser('alerting.getMonitors', params);

      const totalMonitors = _.get(getResponse, 'hits.total.value', 0);
      const monitorKeyValueTuples = _.get(getResponse, 'hits.hits', []).map((result) => {
        const {
          _id: id,
          _version: version,
          _seq_no: ifSeqNo,
          _primary_term: ifPrimaryTerm,
          _source,
        } = result;
        const monitor = _source.monitor ? _source.monitor : _source;
        monitor['item_type'] = monitor.workflow_type || monitor.monitor_type;
        const { name, enabled, item_type } = monitor;
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
      if (aggsSorts[sortField]) {
        aggsOrderData.order = { [aggsSorts[sortField]]: sortDirection };
      }
      const aggsParams = {
        index: INDEX.ALL_ALERTS,
        body: {
          size: 0,
          query: { terms: { monitor_id: monitorIdsOutput } },
          aggregations: {
            uniq_monitor_ids: {
              terms: {
                field: 'monitor_id',
                ...aggsOrderData,
                size: from + size,
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
                    _source: {
                      includes: ['last_notification_time', 'trigger_name'],
                    },
                  },
                },
              },
            },
          },
        },
      };

      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      const esAggsResponse = await callAsCurrentUser('alerting.getMonitors', aggsParams);
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

      let results = _.orderBy(buckets.concat(unusedMonitors), [sortField], [sortDirection]);
      // If we sorted on monitor name then we already applied from/size to the first query to limit what we're aggregating over
      // Therefore we do not need to apply from/size to this result set
      // If we sorted on aggregations, then this is our in memory pagination
      if (!monitorSorts[sortField]) {
        results = results.slice(from, from + size);
      }

      return res.ok({
        body: {
          ok: true,
          monitors: results,
          totalMonitors,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - getMonitors', err);
      if (isIndexNotFoundError(err)) {
        return res.ok({
          body: { ok: false, resp: { totalMonitors: 0, monitors: [] } },
        });
      }
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  acknowledgeAlerts = async (context, req, res) => {
    try {
      const { id } = req.params;
      const params = {
        monitorId: id,
        body: req.body,
      };
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      const acknowledgeResponse = await callAsCurrentUser('alerting.acknowledgeAlerts', params);
      return res.ok({
        body: {
          ok: !acknowledgeResponse.failed.length,
          resp: acknowledgeResponse,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - acknowledgeAlerts:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  acknowledgeChainedAlerts = async (context, req, res) => {
    try {
      const { id } = req.params;
      const params = {
        workflowId: id,
        body: req.body,
      };
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      const acknowledgeResponse = await callAsCurrentUser(
        'alerting.acknowledgeChainedAlerts',
        params
      );
      return res.ok({
        body: {
          ok: !acknowledgeResponse.failed.length,
          resp: acknowledgeResponse,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - acknowledgeChainedAlerts:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  executeMonitor = async (context, req, res) => {
    try {
      const { dryrun = 'true' } = req.query;
      const params = {
        body: req.body,
        dryrun,
      };
      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const executeResponse = await callAsCurrentUser('alerting.executeMonitor', params);
      return res.ok({
        body: {
          ok: true,
          resp: executeResponse,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - executeMonitor:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  //TODO: This is temporarily a pass through call which needs to be deprecated
  searchMonitors = async (context, req, res) => {
    try {
      const { query, index, size } = req.body;
      const params = { index, size, body: query };

      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const results = await callAsCurrentUser('alerting.getMonitors', params);
      return res.ok({
        body: {
          ok: true,
          resp: results,
        },
      });
    } catch (err) {
      console.error('Alerting - MonitorService - searchMonitor:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };
}
