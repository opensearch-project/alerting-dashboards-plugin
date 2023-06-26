/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { anomalyResultMapper } from '../adHelpers';

describe('helpers', () => {
  describe('anomalyResultMapper', () => {
    test('test empty anomaly results', () => {
      const result = anomalyResultMapper([]);
      expect(result).toEqual({
        anomalies: [],
        featureData: {},
      });
    });
    test('test anomaly results', () => {
      const result = anomalyResultMapper([
        {
          detectorId: 'LNULDnEBdsd5fFw6Wr6N',
          dataStartTime: 1587929940000,
          dataEndTime: 1587930000000,
          featureData: [
            {
              featureId: '2yBFFHEB2Y_3etGU7rb_',
              featureName: 'aaa',
              data: 21.023595538333293,
            },
            {
              featureId: 'ExgBJXEB0eMzkM5meZRR',
              featureName: 'bbb',
              data: 21.023595538333293,
            },
            {
              featureId: 'FBgBJXEB0eMzkM5meZRS',
              featureName: 'ccc',
              data: 42.047191076666586,
            },
          ],
          anomalyGrade: 0,
          confidence: 0.99,
        },
        {
          detectorId: 'LNULDnEBdsd5fFw6Wr6N',
          dataStartTime: 1587930420000,
          dataEndTime: 1587930480000,
          featureData: [
            {
              featureId: '2yBFFHEB2Y_3etGU7rb_',
              featureName: 'aaa',
              data: 20.3196071665,
            },
            {
              featureId: 'ExgBJXEB0eMzkM5meZRR',
              featureName: 'bbb',
              data: 20.3196071665,
            },
            {
              featureId: 'FBgBJXEB0eMzkM5meZRS',
              featureName: 'ccc',
              data: 40.639214333,
            },
          ],
          anomalyGrade: 0,
          confidence: 0.99,
        },
      ]);
      expect(result).toEqual({
        anomalies: [
          {
            detectorId: 'LNULDnEBdsd5fFw6Wr6N',
            dataStartTime: 1587929940000,
            dataEndTime: 1587930000000,
            anomalyGrade: 0,
            confidence: '0.99',
            plotTime: 1587929970000,
          },
          {
            detectorId: 'LNULDnEBdsd5fFw6Wr6N',
            dataStartTime: 1587930420000,
            dataEndTime: 1587930480000,
            anomalyGrade: 0,
            confidence: '0.99',
            plotTime: 1587930450000,
          },
        ],
        featureData: {
          '2yBFFHEB2Y_3etGU7rb_': [
            {
              startTime: 1587929940000,
              endTime: 1587930000000,
              plotTime: 1587929970000,
              data: 21.023595538333293,
            },
            {
              startTime: 1587930420000,
              endTime: 1587930480000,
              plotTime: 1587930450000,
              data: 20.3196071665,
            },
          ],
          ExgBJXEB0eMzkM5meZRR: [
            {
              startTime: 1587929940000,
              endTime: 1587930000000,
              plotTime: 1587929970000,
              data: 21.023595538333293,
            },
            {
              startTime: 1587930420000,
              endTime: 1587930480000,
              plotTime: 1587930450000,
              data: 20.3196071665,
            },
          ],
          FBgBJXEB0eMzkM5meZRS: [
            {
              startTime: 1587929940000,
              endTime: 1587930000000,
              plotTime: 1587929970000,
              data: 42.047191076666586,
            },
            {
              startTime: 1587930420000,
              endTime: 1587930480000,
              plotTime: 1587930450000,
              data: 40.639214333,
            },
          ],
        },
      });
    });
  });
});
