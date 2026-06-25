/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MDSEnabledClientService } from './MDSEnabledClientService';

export default class OpensearchService extends MDSEnabledClientService {
  // Skip oasis for general OpenSearch APIs (_cat, _cluster, etc.) — use the standard MDS client.
  async getClientBasedOnDataSource(context, request) {
    const dataSourceId = request.query?.dataSourceId;
    if (!this.dataSourceEnabled || !dataSourceId) {
      return this.osDriver.asScoped(request).callAsCurrentUser;
    }
    return context.dataSource.opensearch.legacy.getClient(dataSourceId.toString()).callAPI;
  }

  // TODO: This will be deprecated as we do not want to support accessing alerting indices directly
  //  and that is what this is used for
  search = async (context, req, res) => {
    try {
      const aclResponse = await this.enforceWorkspaceAcl(context, req, res, ['library_read']);
      if (aclResponse) return aclResponse;

      const { query, index, size } = req.body;
      const params = { index, size, body: query };
      const client = await this.getClientBasedOnDataSource(context, req);
      const results = await client('search', params);
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
      const aclResponse = await this.enforceWorkspaceAcl(context, req, res, ['library_read']);
      if (aclResponse) return aclResponse;

      const { index } = req.body;
      const client = await this.getClientBasedOnDataSource(context, req);
      const indices = await client('cat.indices', {
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
      const aclResponse = await this.enforceWorkspaceAcl(context, req, res, ['library_read']);
      if (aclResponse) return aclResponse;

      const { alias } = req.body;
      const client = await this.getClientBasedOnDataSource(context, req);
      const aliases = await client('cat.aliases', {
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
      const aclResponse = await this.enforceWorkspaceAcl(context, req, res, ['library_read']);
      if (aclResponse) return aclResponse;

      const client = await this.getClientBasedOnDataSource(context, req);
      const health = await client('cat.health', {
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
      const aclResponse = await this.enforceWorkspaceAcl(context, req, res, ['library_read']);
      if (aclResponse) return aclResponse;

      const { index } = req.body;
      const client = await this.getClientBasedOnDataSource(context, req);
      const mappings = await client('indices.getMapping', { index });
      return res.ok({
        body: {
          ok: true,
          resp: mappings,
        },
      });
    } catch (err) {
      const isIndexMissing = err?.body?.error?.type === 'index_not_found_exception';
      if (!isIndexMissing) {
        console.error('Alerting - OpensearchService - getMappings:', err);
      }
      return res.ok({
        body: {
          ok: false,
          resp: isIndexMissing ? 'Incorrect data source or invalid index' : err.message,
        },
      });
    }
  };

  getPlugins = async (context, req, res) => {
    try {
      const aclResponse = await this.enforceWorkspaceAcl(context, req, res, ['library_read']);
      if (aclResponse) return aclResponse;

      const client = await this.getClientBasedOnDataSource(context, req);
      const plugins = await client('cat.plugins', {
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
      const aclResponse = await this.enforceWorkspaceAcl(context, req, res, ['library_read']);
      if (aclResponse) return aclResponse;

      const client = await this.getClientBasedOnDataSource(context, req);
      const settings = await client('cluster.getSettings', {
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
