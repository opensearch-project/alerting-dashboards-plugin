/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MDSEnabledClientService } from './MDSEnabledClientService';

export default class CrossClusterService extends MDSEnabledClientService {
  getRemoteIndexes = async (context, req, res) => {
    try {
      const client = this.getClientBasedOnDataSource(context, req);
      delete req.query['dataSourceId'];
      const response = await client('alerting.getRemoteIndexes', req.query);

      return res.ok({
        body: {
          ok: true,
          resp: response,
        },
      });
    } catch (err) {
      console.error('Alerting - CrossClusterService - getRemoteIndexes:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };
}
