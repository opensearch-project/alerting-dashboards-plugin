/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
      const indices = await callAsCurrentUser('cat.indices', {
        index,
        format: 'json',
        h: 'health,index,status',
      });
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
      const aliases = await callAsCurrentUser('cat.aliases', {
        alias,
        format: 'json',
        h: 'alias,index',
      });
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
      const mappings = await callAsCurrentUser('indices.getMapping', { index });
      return res.ok({
        body: {
          ok: true,
          resp: mappings,
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

  getRoles = async (context, req, res) => {
    try {
      const { role } = req.body;
      const { callAsCurrentUser } = this.esDriver.asScoped(req);

      // Try to get all backend roles in the system if the user has sufficient permission
      try {
        const roles_results = await callAsCurrentUser('transport.request', {
          method: 'GET',
          path: '_plugins/_security/api/rolesmapping',
        });
        let all_backend_roles = new Set();

        for (let key in roles_results) {
          roles_results[key].backend_roles.forEach((item) => all_backend_roles.add(item));
        }

        return res.ok({
          body: {
            ok: true,
            resp: Array.from(all_backend_roles).filter((item) => !role || item.includes(role)),
          },
        });
      } catch (err) {
        console.log('Alerting - OpensearchService - getRoles: get rolemappings:', err.message);
      }

      // Get users roles
      const account_results = await callAsCurrentUser('transport.request', {
        method: 'GET',
        path: '_plugins/_security/api/account',
      });

      return res.ok({
        body: {
          ok: true,
          resp: account_results.backend_roles.filter((item) => !role || item.includes(role)),
        },
      });
    } catch (err) {
      console.error('Alerting - OpensearchService - getRoles:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };
}
