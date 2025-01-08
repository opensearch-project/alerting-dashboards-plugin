/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { getDefaultScript, getTriggerContext, getTimeZone } from './helper';
import { MONITOR_TYPE } from '../../../utils/constants';
import {
  FORMIK_INITIAL_DOC_LEVEL_SCRIPT,
  FORMIK_INITIAL_TRIGGER_VALUES,
} from '../containers/CreateTrigger/utils/constants';
import {
  API_TYPES,
  DEFAULT_CLUSTER_METRICS_SCRIPT,
} from '../../CreateMonitor/components/ClusterMetricsMonitor/utils/clusterMetricsMonitorConstants';
import moment from 'moment-timezone';
import { formikToTrigger } from '../containers/CreateTrigger/utils/formikToTrigger';

describe('CreateTrigger/utils/helper', () => {
  describe('getDefaultScript', () => {
    test('when monitor_type is undefined', () => {
      const monitorValues = undefined;
      expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_TRIGGER_VALUES.script);
    });

    test(`when monitor_type is ${MONITOR_TYPE.BUCKET_LEVEL}`, () => {
      const monitorValues = { monitor_type: MONITOR_TYPE.BUCKET_LEVEL };
      expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_TRIGGER_VALUES.bucketSelector);
    });

    test(`when monitor_type is ${MONITOR_TYPE.DOC_LEVEL}`, () => {
      const monitorValues = { monitor_type: MONITOR_TYPE.DOC_LEVEL };
      expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_DOC_LEVEL_SCRIPT);
    });

    test(`when monitor_type is ${MONITOR_TYPE.QUERY_LEVEL}`, () => {
      const monitorValues = { monitor_type: MONITOR_TYPE.QUERY_LEVEL };
      expect(getDefaultScript(monitorValues)).toEqual(FORMIK_INITIAL_TRIGGER_VALUES.script);
    });

    describe(`when monitor_type is ${MONITOR_TYPE.CLUSTER_METRICS}`, () => {
      test('and api_type is undefined', () => {
        const monitorValues = {
          monitor_type: MONITOR_TYPE.CLUSTER_METRICS,
          uri: undefined,
        };
        expect(getDefaultScript(monitorValues)).toEqual(DEFAULT_CLUSTER_METRICS_SCRIPT);
      });

      test('and api_type is empty', () => {
        const monitorValues = {
          monitor_type: MONITOR_TYPE.CLUSTER_METRICS,
          uri: {
            api_type: '',
          },
        };
        expect(getDefaultScript(monitorValues)).toEqual(DEFAULT_CLUSTER_METRICS_SCRIPT);
      });

      test('and api_type does not have a default condition', () => {
        const monitorValues = {
          monitor_type: MONITOR_TYPE.CLUSTER_METRICS,
          uri: {
            api_type: 'unknownApi',
          },
        };
        expect(getDefaultScript(monitorValues)).toEqual(DEFAULT_CLUSTER_METRICS_SCRIPT);
      });

      _.keys(API_TYPES).forEach((apiType) => {
        test(`and api_type is ${apiType}`, () => {
          const monitorValues = {
            monitor_type: MONITOR_TYPE.CLUSTER_METRICS,
            uri: {
              api_type: apiType,
            },
          };
          const expectedOutput = _.get(API_TYPES, `${apiType}.defaultCondition`);
          if (!_.isEmpty(expectedOutput))
            expect(getDefaultScript(monitorValues)).toEqual(expectedOutput);
        });
      });
    });
  });

  describe('getTriggerContext', () => {
    test("Should return a proper trigger context", () => {
      const mockMonitor = {
        "name": "Test",
        "type": "monitor",
        "monitor_type": "query_level_monitor",
        "enabled": true,
        "schedule": {
          "period": {
            "interval": 1,
            "unit": "MINUTES"
          }
        },
        "inputs": [
          {
            "search": {
              "indices": [
                "opensearch_dashboards_sample_data_ecommerce"
              ],
              "query": {
                "size": 0,
                "aggregations": {},
                "query": {
                  "bool": {
                    "filter": [
                      {
                        "range": {
                          "order_date": {
                          "gte": "{{period_end}}||-1h",
                          "lte": "{{period_end}}",
                          "format": "epoch_millis"
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        ],
        "triggers": [],
        "ui_metadata": {
          "schedule": {
            "timezone": null,
            "frequency": "interval",
            "period": {
              "interval": 1,
              "unit": "MINUTES"
            },
            "daily": 0,
            "weekly": {
              "mon": false,
              "tue": false,
              "wed": false,
              "thur": false,
              "fri": false,
              "sat": false,
              "sun": false
            },
            "monthly": {
              "type": "day",
              "day": 1
            },
            "cronExpression": "0 */1 * * *"
          },
          "monitor_type": "query_level_monitor",
          "search": {
            "searchType": "graph",
            "timeField": "order_date",
            "aggregations": [],
            "groupBy": [],
            "bucketValue": 1,
            "bucketUnitOfTime": "h",
            "filters": []
          }
        }
      };
      const mockInputResults = {
        results: [
          {
            "_shards": {
              "total": 1,
              "failed": 0,
              "successful": 1,
              "skipped": 0
            },
            "hits": {
              "hits": [],
              "total": {
                "value": 33,
                "relation": "eq"
              },
              "max_score": null
            },
            "took": 3,
            "timed_out": false,
            "aggregations": {
              "over": {
                "buckets": [
                  {
                    "key_as_string": "2025-01-06T08:00:00.000-08:00",
                    "doc_count": 8,
                    "key": 1736179200000
                  },
                  {
                    "key_as_string": "2025-01-06T09:00:00.000-08:00",
                    "doc_count": 4,
                    "key": 1736182800000
                  },
                  {
                    "key_as_string": "2025-01-06T10:00:00.000-08:00",
                    "doc_count": 8,
                    "key": 1736186400000
                  },
                  {
                    "key_as_string": "2025-01-06T11:00:00.000-08:00",
                    "doc_count": 7,
                    "key": 1736190000000
                  },
                  {
                    "key_as_string": "2025-01-06T12:00:00.000-08:00",
                    "doc_count": 5,
                    "key": 1736193600000
                  },
                  {
                    "key_as_string": "2025-01-06T13:00:00.000-08:00",
                    "doc_count": 1,
                    "key": 1736197200000
                  }
                ]
              }
            }
          }
        ]
      };
      const mockExecuteResponse = {
        period_start: "2025-01-06T21:11:41Z",
        period_end: "2025-01-06T21:12:41Z",
        input_results: mockInputResults,
      };
      const mockValues = {
        name: "Test",
        severity: "1",
        condition: {
          script: "ctx.results[0].hits.total.value > 10000"
        }
      };
      const mockTrigger = formikToTrigger(mockValues, _.get(mockMonitor, 'ui_metadata', {}));
      if (_.isArray(mockTrigger) && triggerIndex >= 0) mockTrigger = mockTrigger[triggerIndex];
      const result = getTriggerContext(mockExecuteResponse, mockMonitor, mockValues);
      expect(result).toEqual({
        periodStart: moment.utc(_.get(mockExecuteResponse, 'period_start', Date.now())).tz(getTimeZone()).format(),
        periodEnd: moment.utc(_.get(mockExecuteResponse, 'period_end', Date.now())).tz(getTimeZone()).format(),
        results: [_.get(mockExecuteResponse, 'input_results.results[0]')].filter((result) => !!result),
        trigger: mockTrigger,
        alert: null,
        error: null,
        monitor: mockMonitor
      });
    });
  });
});
