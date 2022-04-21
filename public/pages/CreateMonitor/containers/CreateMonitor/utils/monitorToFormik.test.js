/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import monitorToFormik from './monitorToFormik';

import { FORMIK_INITIAL_VALUES, MATCH_ALL_QUERY } from './constants';
import { MONITOR_TYPE, SEARCH_TYPE } from '../../../../../utils/constants';

const exampleMonitor = {
  name: 'Example Monitor',
  enabled: true,
  schedule: {
    cron: { expression: '0 0 0/2 * * ?' },
  },
  inputs: [
    {
      search: {
        indices: ['test-index'],
        query: JSON.parse(MATCH_ALL_QUERY),
      },
    },
  ],
  triggers: [],
  ui_metadata: {
    schedule: {
      cronExpression: '0 0 0/2 * * ?',
      period: {
        unit: 'MINUTES',
        interval: 1,
      },
      daily: {
        hours: 0,
        gmt: -1,
      },
      monthly: {
        type: 'day',
        day: 1,
        ordinal: 'day',
      },
      weekly: {
        tue: false,
        wed: false,
        thur: false,
        sat: false,
        fri: false,
        mon: false,
        sun: false,
      },
      frequency: 'cronExpression',
    },
    search: {
      aggregationType: 'count',
      fieldName: '',
      timeField: 'somefield',
      overDocuments: 'all documents',
      searchType: 'graph',
      bucketValue: 1,
      groupedOverTop: 5,
      bucketUnitOfTime: 'h',
      groupedOverFieldName: 'bytes',
    },
  },
};

describe('monitorToFormik', () => {
  test("returns default formik values when monitor doesn't exist", () => {
    const formikValues = _.cloneDeep(FORMIK_INITIAL_VALUES);
    const monitor = null;
    expect(monitorToFormik(monitor)).toEqual(formikValues);
  });

  describe('extracts', () => {
    test('simple fields from monitor', () => {
      const formikValues = monitorToFormik(exampleMonitor);
      expect(formikValues.name).toBe(exampleMonitor.name);
      expect(formikValues.disabled).toBe(!exampleMonitor.enabled);
      expect(formikValues.query).toBe(
        JSON.stringify(exampleMonitor.inputs[0].search.query, null, 4)
      );
      expect(formikValues.index).toEqual(
        exampleMonitor.inputs[0].search.indices.map((index) => ({ label: index }))
      );
    });

    test('empty fieldName from monitor', () => {
      const formikValues = monitorToFormik(exampleMonitor);
      expect(formikValues.fieldName).toEqual([]);
    });

    test('fieldName from monitor', () => {
      const localExampleMonitor = _.cloneDeep(exampleMonitor);
      localExampleMonitor.ui_metadata.search.fieldName = 'bytes';
      const formikValues = monitorToFormik(localExampleMonitor);
      expect(formikValues.fieldName).toEqual([{ label: 'bytes' }]);
    });

    test('timeField from monitor', () => {
      const localExampleMonitor = _.cloneDeep(exampleMonitor);
      const formikValues = monitorToFormik(localExampleMonitor);
      expect(formikValues.timeField).toBe(localExampleMonitor.ui_metadata.search.timeField);
    });

    test('default cronExpression when monitor has period schedule', () => {
      const localExampleMonitor = _.cloneDeep(exampleMonitor);
      localExampleMonitor.schedule = { period: { interval: 1, unit: 'MINUTES' } };
      const formikValues = monitorToFormik(localExampleMonitor);
      expect(formikValues.cronExpression).toBe(FORMIK_INITIAL_VALUES.cronExpression);
    });

    test('can build AD monitor', () => {
      const adMonitor = _.cloneDeep(exampleMonitor);
      adMonitor.ui_metadata.search.searchType = 'ad';
      adMonitor.inputs = [
        {
          search: {
            indices: ['.opendistro-anomaly-results*'],
            query: {
              aggregations: { max_anomaly_grade: { max: { field: 'anomaly_grade' } } },
              query: {
                bool: {
                  filter: [
                    {
                      range: {
                        end_time: {
                          from: '{{period_end}}||-2m',
                          include_lower: true,
                          include_upper: true,
                          to: '{{period_end}}',
                        },
                      },
                    },
                    {
                      term: {
                        detector_id: {
                          value: 'zIqG0nABwoJjo1UZKHnL',
                        },
                      },
                    },
                  ],
                },
              },
              size: 1,
              sort: [{ anomaly_grade: { order: 'desc' } }, { confidence: { order: 'desc' } }],
            },
          },
        },
      ];
      const formikValues = monitorToFormik(adMonitor);
      expect(formikValues.detectorId).toBe('zIqG0nABwoJjo1UZKHnL');
      expect(formikValues.query).toContain('zIqG0nABwoJjo1UZKHnL');
    });
  });

  describe('can build ClusterMetricsMonitor', () => {
    test('with path params', () => {
      const clusterMetricsMonitor = _.cloneDeep(exampleMonitor);
      clusterMetricsMonitor.monitor_type = MONITOR_TYPE.CLUSTER_METRICS;
      clusterMetricsMonitor.ui_metadata.search.searchType = SEARCH_TYPE.CLUSTER_METRICS;
      clusterMetricsMonitor.inputs = [
        {
          uri: {
            path: '/_cluster/health',
            path_params: 'params',
          },
        },
      ];
      const formikValues = monitorToFormik(clusterMetricsMonitor);
      expect(formikValues.uri.path).toBe('/_cluster/health');
      expect(formikValues.uri.path_params).toBe('params');
    });
    test('without path params', () => {
      const clusterMetricsMonitor = _.cloneDeep(exampleMonitor);
      clusterMetricsMonitor.monitor_type = MONITOR_TYPE.CLUSTER_METRICS;
      clusterMetricsMonitor.ui_metadata.search.searchType = SEARCH_TYPE.CLUSTER_METRICS;
      clusterMetricsMonitor.inputs = [
        {
          uri: {
            path: '/_cluster/health',
          },
        },
      ];
      const formikValues = monitorToFormik(clusterMetricsMonitor);
      expect(formikValues.uri.path).toBe('/_cluster/health');
    });
  });
});
