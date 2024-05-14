/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { get } from 'lodash';
import { mapKeysDeep, toCamel } from './utils/helpers';
import { anomalyResultMapper } from './utils/adHelpers';
import { MDSEnabledClientService } from './MDSEnabledClientService';

const MAX_DETECTOR_COUNT = 1000;
export default class DestinationsService extends MDSEnabledClientService {
  constructor(esDriver, dataSourceEnabled) {
    super(esDriver, dataSourceEnabled);
  }

  getDetector = async (context, req, res) => {
    const { detectorId } = req.params;
    const client = this.getClientBasedOnDataSource(context, req);
    try {
      const resp = await client('alertingAD.getDetector', { detectorId });
      const {
        anomaly_detector,
        _seq_no: seqNo,
        _primary_term: primaryTerm,
        _version: version,
      } = resp;
      return res.ok({
        body: {
          ok: true,
          detector: anomaly_detector,
          version,
          seqNo,
          primaryTerm,
        },
      });
    } catch (err) {
      console.error('Alerting - AnomalyDetectorService - getDetector:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  getDetectors = async (context, req, res) => {
    const searchRequest = {
      query: { bool: {} },
      size: MAX_DETECTOR_COUNT,
    };
    const client = this.getClientBasedOnDataSource(context, req);
    try {
      const resp = await client('alertingAD.searchDetectors', {
        body: searchRequest,
      });

      const totalDetectors = resp.hits.total.value;
      const detectors = resp.hits.hits.map((hit) => {
        const {
          _source: detector,
          _id: id,
          _version: version,
          _seq_no: seqNo,
          _primary_term: primaryTerm,
        } = hit;
        return { id, ...detector, version, seqNo, primaryTerm };
      });
      return res.ok({
        body: {
          ok: true,
          detectors: mapKeysDeep(detectors, toCamel),
          totalDetectors,
        },
      });
    } catch (err) {
      console.error('Alerting - AnomalyDetectorService - searchDetectors:', err);
      return res.ok({
        body: {
          ok: false,
          resp: err.message,
        },
      });
    }
  };

  getDetectorResults = async (context, req, res) => {
    try {
      const { startTime = 0, endTime = 20, preview = 'false' } = req.query;
      const { detectorId } = req.params;
      const client = this.getClientBasedOnDataSource(context, req);
      if (preview == 'true') {
        const requestBody = {
          period_start: startTime,
          period_end: endTime,
        };
        const previewResponse = await client('alertingAD.previewDetector', {
          detectorId,
          body: requestBody,
        });
        const transformedKeys = mapKeysDeep(previewResponse, toCamel);
        return res.ok({
          body: {
            ok: true,
            response: {
              anomalyResult: anomalyResultMapper(transformedKeys.anomalyResult),
              detector: transformedKeys.anomalyDetector,
            },
          },
        });
      } else {
        //Get results
        const requestBody = {
          size: 10000,
          sort: {
            data_start_time: 'asc',
          },
          query: {
            bool: {
              filter: [
                {
                  term: {
                    detector_id: detectorId,
                  },
                },
                {
                  range: {
                    data_start_time: {
                      gte: startTime,
                      lte: endTime,
                    },
                  },
                },
              ],
            },
          },
        };
        const detectorResponse = await client('alertingAD.getDetector', {
          detectorId,
        });
        const anomaliesResponse = await client('alertingAD.searchResults', {
          body: requestBody,
        });
        const transformedKeys = get(anomaliesResponse, 'hits.hits', []).map((result) =>
          mapKeysDeep(result._source, toCamel)
        );
        return res.ok({
          body: {
            ok: true,
            response: {
              detector: mapKeysDeep(get(detectorResponse, 'anomaly_detector', {}), toCamel),
              anomalyResult: anomalyResultMapper(transformedKeys),
            },
          },
        });
      }
    } catch (err) {
      console.log('Alerting - AnomalyDetectorService - getDetectorResults', err);
      return res.ok({
        body: {
          ok: false,
          error: err.message,
        },
      });
    }
  };
}
