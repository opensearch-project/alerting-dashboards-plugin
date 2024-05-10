/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';

export default class OpensearchService {
  constructor(esDriver) {
    this.esDriver = esDriver;
  }

  // TODO: This will be deprecated as we do not want to support accessing alerting indices directly
  //  and that is what this is used for
  search = async (context, req, res) => {
    try {
      const { query, index, size } = req.body;
      const params = { index, size, body: query };
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      const results = await callAsCurrentUser('search', params);
      return res.ok({
        body: {
          ok: true,
          resp: results,
        },
      });
    } catch (err) {
      console.error('Alerting - OpensearchService - search', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  getIndices = async (context, req, res) => {
    try {
      const { index } = req.body;
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      let indices = [];
      if (index.includes(':')) {
        const resolve_resp = await callAsCurrentUser('transport.request', {
          method: 'GET',
          path: '/_resolve/index/' + index,
        });
        indices = resolve_resp.indices.map((item) => ({
          index: item.name,
          status: item.attributes[0],
          health: 'undefined',
        }));
      } else {
        indices = await callAsCurrentUser('cat.indices', {
          index,
          format: 'json',
          h: 'health,index,status',
        });
      }
      return res.ok({
        body: {
          ok: true,
          resp: indices,
        },
      });
    } catch (err) {
      // Opensearch throws an index_not_found_exception which we'll treat as a success
      if (err.statusCode === 404) {
        return res.ok({
          body: {
            ok: true,
            resp: [],
          },
        });
      } else {
        console.error('Alerting - OpensearchService - getIndices:', err);
        return res.ok({
          body: {
            ok: false,
            resp: err.message,
          },
        });
      }
    }
  };

  getAliases = async (context, req, res) => {
    try {
      const { alias } = req.body;
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      let aliases = [];
      if (alias.includes(':')) {
        const resolve_resp = await callAsCurrentUser('transport.request', {
          method: 'GET',
          path: '/_resolve/index/' + alias,
        });
        aliases = resolve_resp.aliases.flatMap((alias_item) =>
          alias_item.indices.map((index) => ({ alias: alias_item.name, index: index }))
        );
      } else {
        aliases = await callAsCurrentUser('cat.aliases', {
          alias,
          format: 'json',
          h: 'alias,index',
        });
      }
      return res.ok({
        body: {
          ok: true,
          resp: aliases,
        },
      });
    } catch (err) {
      console.error('Alerting - OpensearchService - getAliases:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  getClusterHealth = async (context, req, res) => {
    try {
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      const health = await callAsCurrentUser('cat.health', {
        format: 'json',
        h: 'cluster,status',
      });
      return res.ok({
        body: {
          ok: true,
          resp: health,
        },
      });
    } catch (err) {
      console.error('Alerting - OpensearchService - getClusterHealth:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  getMappings = async (context, req, res) => {
    try {
      const { index } = req.body;
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      let local_mappings = {};
      let remote_mappings = {};
      let local_indices = index.filter((e) => !e.includes(':'));
      let remote_indices = index.filter((e) => e.includes(':'));
      if (remote_indices.length) {
        const fc_resp = await callAsCurrentUser('transport.request', {
          method: 'GET',
          path: remote_indices.toString() + '/_field_caps?fields=*&include_unmapped',
        });
        fc_resp.indices.forEach((index_name) => {
          remote_mappings[index_name] = {
            mappings: {
              properties: {},
            },
          };
        });
        for (const [k1, v1] of Object.entries(fc_resp.fields)) {
          if (k1.startsWith('_')) {
            continue;
          }
          for (const [k2, v2] of Object.entries(v1)) {
            if (k2 == 'unmapped') {
              continue;
            }
            let mapped_indices = _.get(v2, 'indices', fc_resp.indices);
            mapped_indices.forEach((mapped_index) => {
              remote_mappings[mapped_index]['mappings']['properties'][k1] = {
                type: v2.type,
              };
            });
          }
        }
      }
      if (local_indices.length) {
        local_mappings = await callAsCurrentUser('indices.getMapping', { index: local_indices });
      }
      return res.ok({
        body: {
          ok: true,
          resp: { ...local_mappings, ...remote_mappings },
        },
      });
    } catch (err) {
      console.error('Alerting - OpensearchService - getMappings:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  getPlugins = async (context, req, res) => {
    try {
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      const plugins = await callAsCurrentUser('cat.plugins', {
        format: 'json',
        h: 'component',
      });
      return res.ok({
        body: {
          ok: true,
          resp: plugins,
        },
      });
    } catch (err) {
      console.error('Alerting - OpensearchService - getPlugins:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  getSettings = async (context, req, res) => {
    try {
      const { callAsCurrentUser } = this.esDriver.asScoped(req);
      const settings = await callAsCurrentUser('cluster.getSettings', {
        include_defaults: 'true',
      });
      return res.ok({
        body: {
          ok: true,
          resp: settings,
        },
      });
    } catch (err) {
      console.error('Alerting - OpensearchService - getSettings:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };
}
