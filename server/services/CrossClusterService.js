/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export default class CrossClusterService {
  constructor(esDriver) {
    this.esDriver = esDriver;
  }

  getRemoteIndexes = async (context, req, res) => {
    try {
      const { callAsCurrentUser } = await this.esDriver.asScoped(req);
      const response = await callAsCurrentUser('alerting.getRemoteIndexes', req.query);

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
