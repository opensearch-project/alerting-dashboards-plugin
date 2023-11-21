/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import {
  addAlert,
  addFirstAlert,
  displayAcknowledgedAlertsToast,
  filterActiveAlerts,
  getInitialSize,
  getQueryObjectFromState,
  getURLQueryParams,
  groupAlertsByTrigger,
  insertGroupByColumn,
  removeColumns,
  renderEmptyValue,
} from './helpers';
import { ALERT_STATE, DEFAULT_EMPTY_DATA } from '../../../utils/constants';
import { bucketColumns } from './tableUtils';
import { DEFAULT_GET_ALERTS_QUERY_PARAMS, MAX_ALERT_COUNT } from './constants';
import coreMock from '../../../../test/mocks/CoreMock';

describe('Dashboard/utils/helpers', () => {
  describe('groupAlertsByTrigger', () => {
    test('with empty alerts list', () => {
      const alerts = [];
      const expectedOutput = [];
      expect(groupAlertsByTrigger(alerts)).toEqual(expectedOutput);
    });

    test('with undefined alerts list', () => {
      const alerts = undefined;
      const expectedOutput = [];
      expect(groupAlertsByTrigger(alerts)).toEqual(expectedOutput);
    });

    test('with valid alerts list', () => {
      const alerts = [
        {
          id: 'bucket-monitor-trigger1-alert1',
          monitor_name: 'bucket-monitor',
          trigger_id: 'bucket-monitor-trigger1-id',
          trigger_name: 'bucket-monitor-trigger1',
          state: 'ACTIVE',
          start_time: 1638360000000,
          end_time: null,
          agg_alert_content: {
            parent_bucket_path: 'composite_agg',
            bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
            bucket: {
              doc_count: 10,
              field1: {
                value: 100,
              },
              field2: {
                value: 200,
              },
              key: {
                groupBy1: 'groupBy1Keyword',
                groupBy2: 'groupBy2Keyword',
              },
            },
          },
        },
        {
          id: 'bucket-monitor-trigger1-alert2',
          monitor_name: 'bucket-monitor',
          trigger_id: 'bucket-monitor-trigger1-id',
          trigger_name: 'bucket-monitor-trigger1',
          state: 'ACTIVE',
          start_time: 1638360000000,
          end_time: null,
          agg_alert_content: {
            parent_bucket_path: 'composite_agg',
            bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
            bucket: {
              doc_count: 10,
              field1: {
                value: 100,
              },
              field2: {
                value: 200,
              },
              key: {
                groupBy1: 'groupBy1Keyword',
                groupBy2: 'groupBy2Keyword',
              },
            },
          },
        },
        {
          id: 'bucket-monitor-trigger2-alert1',
          monitor_name: 'bucket-monitor',
          trigger_id: 'bucket-monitor-trigger2-id',
          trigger_name: 'bucket-monitor-trigger2',
          state: 'ACTIVE',
          start_time: 1638361800000,
          end_time: null,
          agg_alert_content: {
            parent_bucket_path: 'composite_agg',
            bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
            bucket: {
              doc_count: 10,
              field1: {
                value: 100,
              },
              field2: {
                value: 200,
              },
              key: {
                groupBy1: 'groupBy1Keyword',
                groupBy2: 'groupBy2Keyword',
              },
            },
          },
        },
        {
          id: 'query-monitor-trigger1-alert1',
          monitor_name: 'query-monitor',
          trigger_id: 'query-monitor-trigger1-id',
          trigger_name: 'query-monitor-trigger1',
          state: 'ACTIVE',
          start_time: 1638360000000,
          end_time: null,
        },
        {
          id: 'query-monitor-trigger2-alert1',
          monitor_name: 'query-monitor',
          trigger_id: 'query-monitor-trigger2-id',
          trigger_name: 'query-monitor-trigger2',
          state: 'ACTIVE',
          start_time: 1638361800000,
          end_time: null,
        },
      ];
      const expectedOutput = [
        {
          ACTIVE: 2,
          ACKNOWLEDGED: 0,
          ERROR: 0,
          total: 2,
          alerts: [
            {
              id: 'bucket-monitor-trigger1-alert1',
              monitor_name: 'bucket-monitor',
              trigger_id: 'bucket-monitor-trigger1-id',
              trigger_name: 'bucket-monitor-trigger1',
              state: 'ACTIVE',
              start_time: 1638360000000,
              end_time: null,
              agg_alert_content: {
                parent_bucket_path: 'composite_agg',
                bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
                bucket: {
                  doc_count: 10,
                  field1: {
                    value: 100,
                  },
                  field2: {
                    value: 200,
                  },
                  key: {
                    groupBy1: 'groupBy1Keyword',
                    groupBy2: 'groupBy2Keyword',
                  },
                },
              },
            },
            {
              id: 'bucket-monitor-trigger1-alert2',
              monitor_name: 'bucket-monitor',
              trigger_id: 'bucket-monitor-trigger1-id',
              trigger_name: 'bucket-monitor-trigger1',
              state: 'ACTIVE',
              start_time: 1638360000000,
              end_time: null,
              agg_alert_content: {
                parent_bucket_path: 'composite_agg',
                bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
                bucket: {
                  doc_count: 10,
                  field1: {
                    value: 100,
                  },
                  field2: {
                    value: 200,
                  },
                  key: {
                    groupBy1: 'groupBy1Keyword',
                    groupBy2: 'groupBy2Keyword',
                  },
                },
              },
            },
          ],
          trigger_name: 'bucket-monitor-trigger1',
          start_time: 1638360000000,
          monitor_name: 'bucket-monitor',
          triggerID: 'bucket-monitor-trigger1-id',
        },
        {
          ACTIVE: 1,
          ACKNOWLEDGED: 0,
          ERROR: 0,
          total: 1,
          alerts: [
            {
              id: 'bucket-monitor-trigger2-alert1',
              monitor_name: 'bucket-monitor',
              trigger_id: 'bucket-monitor-trigger2-id',
              trigger_name: 'bucket-monitor-trigger2',
              state: 'ACTIVE',
              start_time: 1638361800000,
              end_time: null,
              agg_alert_content: {
                parent_bucket_path: 'composite_agg',
                bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
                bucket: {
                  doc_count: 10,
                  field1: {
                    value: 100,
                  },
                  field2: {
                    value: 200,
                  },
                  key: {
                    groupBy1: 'groupBy1Keyword',
                    groupBy2: 'groupBy2Keyword',
                  },
                },
              },
            },
          ],
          trigger_name: 'bucket-monitor-trigger2',
          start_time: 1638361800000,
          monitor_name: 'bucket-monitor',
          triggerID: 'bucket-monitor-trigger2-id',
        },
        {
          ACTIVE: 1,
          ACKNOWLEDGED: 0,
          ERROR: 0,
          total: 1,
          alerts: [
            {
              id: 'query-monitor-trigger1-alert1',
              monitor_name: 'query-monitor',
              trigger_id: 'query-monitor-trigger1-id',
              trigger_name: 'query-monitor-trigger1',
              state: 'ACTIVE',
              start_time: 1638360000000,
              end_time: null,
            },
          ],
          trigger_name: 'query-monitor-trigger1',
          start_time: 1638360000000,
          monitor_name: 'query-monitor',
          triggerID: 'query-monitor-trigger1-id',
        },
        {
          ACTIVE: 1,
          ACKNOWLEDGED: 0,
          ERROR: 0,
          total: 1,
          alerts: [
            {
              id: 'query-monitor-trigger2-alert1',
              monitor_name: 'query-monitor',
              trigger_id: 'query-monitor-trigger2-id',
              trigger_name: 'query-monitor-trigger2',
              state: 'ACTIVE',
              start_time: 1638361800000,
              end_time: null,
            },
          ],
          trigger_name: 'query-monitor-trigger2',
          start_time: 1638361800000,
          monitor_name: 'query-monitor',
          triggerID: 'query-monitor-trigger2-id',
        },
      ];
      expect(groupAlertsByTrigger(alerts)).toEqual(expectedOutput);
    });
  });

  describe('addFirstAlert', () => {
    test('with bucket-level alert', () => {
      const alert = {
        id: 'bucket-monitor-trigger1-alert1',
        last_notification_time: null,
        monitor_id: 'bucket-monitor-id',
        monitor_name: 'bucket-monitor',
        severity: 5,
        trigger_id: 'bucket-monitor-trigger1-id',
        trigger_name: 'bucket-monitor-trigger1',
        version: 1,
        state: 'ACTIVE',
        start_time: 1638360000000,
        end_time: null,
        agg_alert_content: {
          parent_bucket_path: 'composite_agg',
          bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
          bucket: {
            doc_count: 10,
            field1: {
              value: 100,
            },
            field2: {
              value: 200,
            },
            key: {
              groupBy1: 'groupBy1Keyword',
              groupBy2: 'groupBy2Keyword',
            },
          },
        },
      };
      const expectedOutput = {
        ACTIVE: 1,
        ACKNOWLEDGED: 0,
        ERROR: 0,
        total: 1,
        alerts: [
          {
            id: 'bucket-monitor-trigger1-alert1',
            last_notification_time: null,
            monitor_id: 'bucket-monitor-id',
            monitor_name: 'bucket-monitor',
            severity: 5,
            trigger_id: 'bucket-monitor-trigger1-id',
            trigger_name: 'bucket-monitor-trigger1',
            version: 1,
            state: 'ACTIVE',
            start_time: 1638360000000,
            end_time: null,
            agg_alert_content: {
              parent_bucket_path: 'composite_agg',
              bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
              bucket: {
                doc_count: 10,
                field1: {
                  value: 100,
                },
                field2: {
                  value: 200,
                },
                key: {
                  groupBy1: 'groupBy1Keyword',
                  groupBy2: 'groupBy2Keyword',
                },
              },
            },
          },
        ],
        version: 1,
        trigger_name: 'bucket-monitor-trigger1',
        severity: 5,
        start_time: 1638360000000,
        last_notification_time: null,
        monitor_name: 'bucket-monitor',
        monitor_id: 'bucket-monitor-id',
      };
      expect(addFirstAlert(alert)).toEqual(expectedOutput);
    });
    test('with query-level alert', () => {
      const alert = {
        id: 'query-monitor-trigger1-alert1',
        last_notification_time: null,
        monitor_id: 'query-monitor-id',
        monitor_name: 'query-monitor',
        severity: 5,
        trigger_id: 'query-monitor-trigger1-id',
        trigger_name: 'query-monitor-trigger1',
        version: 1,
        state: 'ACTIVE',
        start_time: 1638360000000,
        end_time: null,
      };
      const expectedOutput = {
        ACTIVE: 1,
        ACKNOWLEDGED: 0,
        ERROR: 0,
        total: 1,
        alerts: [
          {
            id: 'query-monitor-trigger1-alert1',
            last_notification_time: null,
            monitor_id: 'query-monitor-id',
            monitor_name: 'query-monitor',
            severity: 5,
            trigger_id: 'query-monitor-trigger1-id',
            trigger_name: 'query-monitor-trigger1',
            version: 1,
            state: 'ACTIVE',
            start_time: 1638360000000,
            end_time: null,
          },
        ],
        version: 1,
        trigger_name: 'query-monitor-trigger1',
        severity: 5,
        start_time: 1638360000000,
        last_notification_time: null,
        monitor_name: 'query-monitor',
        monitor_id: 'query-monitor-id',
      };
      expect(addFirstAlert(alert)).toEqual(expectedOutput);
    });
  });

  describe('addAlert', () => {
    test('with valid alerts list', () => {
      const alert = {
        id: 'bucket-monitor-trigger1-alert2',
        monitor_name: 'bucket-monitor',
        trigger_id: 'bucket-monitor-trigger1-id',
        trigger_name: 'bucket-monitor-trigger1',
        state: 'ACTIVE',
        start_time: 1638360000000,
        end_time: null,
        agg_alert_content: {
          parent_bucket_path: 'composite_agg',
          bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
          bucket: {
            doc_count: 10,
            field1: {
              value: 100,
            },
            field2: {
              value: 200,
            },
            key: {
              groupBy1: 'groupBy1Keyword',
              groupBy2: 'groupBy2Keyword',
            },
          },
        },
      };
      const alertsList = {
        ACTIVE: 1,
        ACKNOWLEDGED: 0,
        ERROR: 0,
        total: 1,
        alerts: [
          {
            id: 'bucket-monitor-trigger1-alert1',
            monitor_name: 'bucket-monitor',
            trigger_id: 'bucket-monitor-trigger1-id',
            trigger_name: 'bucket-monitor-trigger1',
            state: 'ACTIVE',
            start_time: 1638360000000,
            end_time: null,
            agg_alert_content: {
              parent_bucket_path: 'composite_agg',
              bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
              bucket: {
                doc_count: 10,
                field1: {
                  value: 100,
                },
                field2: {
                  value: 200,
                },
                key: {
                  groupBy1: 'groupBy1Keyword',
                  groupBy2: 'groupBy2Keyword',
                },
              },
            },
          },
        ],
        trigger_name: 'bucket-monitor-trigger1',
        start_time: 1638360000000,
        monitor_name: 'bucket-monitor',
        triggerID: 'bucket-monitor-trigger1-id',
      };
      const expectedOutput = {
        ACTIVE: 2,
        ACKNOWLEDGED: 0,
        ERROR: 0,
        total: 2,
        alerts: [
          {
            id: 'bucket-monitor-trigger1-alert1',
            monitor_name: 'bucket-monitor',
            trigger_id: 'bucket-monitor-trigger1-id',
            trigger_name: 'bucket-monitor-trigger1',
            state: 'ACTIVE',
            start_time: 1638360000000,
            end_time: null,
            agg_alert_content: {
              parent_bucket_path: 'composite_agg',
              bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
              bucket: {
                doc_count: 10,
                field1: {
                  value: 100,
                },
                field2: {
                  value: 200,
                },
                key: {
                  groupBy1: 'groupBy1Keyword',
                  groupBy2: 'groupBy2Keyword',
                },
              },
            },
          },
          {
            id: 'bucket-monitor-trigger1-alert2',
            monitor_name: 'bucket-monitor',
            trigger_id: 'bucket-monitor-trigger1-id',
            trigger_name: 'bucket-monitor-trigger1',
            state: 'ACTIVE',
            start_time: 1638360000000,
            end_time: null,
            agg_alert_content: {
              parent_bucket_path: 'composite_agg',
              bucket_keys: ['groupBy1KeywordValue', 'groupBy2KeywordValue'],
              bucket: {
                doc_count: 10,
                field1: {
                  value: 100,
                },
                field2: {
                  value: 200,
                },
                key: {
                  groupBy1: 'groupBy1Keyword',
                  groupBy2: 'groupBy2Keyword',
                },
              },
            },
          },
        ],
        trigger_name: 'bucket-monitor-trigger1',
        start_time: 1638360000000,
        monitor_name: 'bucket-monitor',
        triggerID: 'bucket-monitor-trigger1-id',
      };
      expect(addAlert(alertsList, alert)).toEqual(expectedOutput);
    });
  });

  describe('renderEmptyValue', () => {
    test('with empty value', () => {
      const value = {};
      expect(renderEmptyValue(value)).toEqual(value);
    });

    test('with undefined value', () => {
      const value = undefined;
      expect(renderEmptyValue(value)).toEqual(DEFAULT_EMPTY_DATA);
    });

    test('with defined value', () => {
      const value = { key: 'value' };
      expect(renderEmptyValue(value)).toEqual(value);
    });
  });

  describe('insertGroupByColumn', () => {
    test('with empty groupBy list', () => {
      const groupBy = [];
      expect(insertGroupByColumn(groupBy)).toEqual(bucketColumns);
    });

    test('with undefined groupBy list', () => {
      const groupBy = undefined;
      expect(insertGroupByColumn(groupBy)).toEqual(bucketColumns);
    });

    test('with valid groupBy list', () => {
      const groupBy = ['keyword1', 'keyword2', 'keyword3'];
      const expectedOutput = _.cloneDeep(bucketColumns);
      expectedOutput.push(
        {
          field: 'agg_alert_content.bucket.key.keyword1',
          name: 'Keyword1',
          render: renderEmptyValue,
          sortable: false,
          truncateText: false,
        },
        {
          field: 'agg_alert_content.bucket.key.keyword2',
          name: 'Keyword2',
          render: renderEmptyValue,
          sortable: false,
          truncateText: false,
        },
        {
          field: 'agg_alert_content.bucket.key.keyword3',
          name: 'Keyword3',
          render: renderEmptyValue,
          sortable: false,
          truncateText: false,
        }
      );
      expect(insertGroupByColumn(groupBy)).toEqual(expectedOutput);
    });
  });

  describe('removeColumns', () => {
    describe('with empty allColumns parameter', () => {
      const allColumns = [];
      test('with empty columnFieldNames', () => {
        const columnFieldNames = [];
        const expectedOutput = [];
        expect(removeColumns(columnFieldNames, allColumns)).toEqual(expectedOutput);
      });

      test('with undefined columnFieldNames', () => {
        const columnFieldNames = undefined;
        const expectedOutput = [];
        expect(removeColumns(columnFieldNames, allColumns)).toEqual(expectedOutput);
      });

      test('with valid columnFieldNames', () => {
        const columnFieldNames = ['first column', 'third column'];
        const expectedOutput = [];
        expect(removeColumns(columnFieldNames, allColumns)).toEqual(expectedOutput);
      });
    });
    describe('with undefined allColumns parameter', () => {
      const allColumns = undefined;
      test('with empty columnFieldNames', () => {
        const columnFieldNames = [];
        const expectedOutput = [];
        expect(removeColumns(columnFieldNames, allColumns)).toEqual(expectedOutput);
      });

      test('with undefined columnFieldNames', () => {
        const columnFieldNames = undefined;
        const expectedOutput = [];
        expect(removeColumns(columnFieldNames, allColumns)).toEqual(expectedOutput);
      });

      test('with valid columnFieldNames', () => {
        const columnFieldNames = ['first column', 'third column'];
        const expectedOutput = [];
        expect(removeColumns(columnFieldNames, allColumns)).toEqual(expectedOutput);
      });
    });
    describe('with valid allColumns parameter', () => {
      const allColumns = [
        { field: 'first column' },
        { field: 'second column' },
        { field: 'third column' },
        { field: 'fourth column' },
        { field: 'fifth column' },
      ];

      test('with empty columnFieldNames', () => {
        const columnFieldNames = [];
        expect(removeColumns(columnFieldNames, allColumns)).toEqual(allColumns);
      });

      test('with undefined columnFieldNames', () => {
        const columnFieldNames = undefined;
        expect(removeColumns(columnFieldNames, allColumns)).toEqual(allColumns);
      });

      test('with valid columnFieldNames', () => {
        const columnFieldNames = ['first column', 'third column'];
        const expectedOutput = [
          { field: 'second column' },
          { field: 'fourth column' },
          { field: 'fifth column' },
        ];
        expect(removeColumns(columnFieldNames, allColumns)).toEqual(expectedOutput);
      });
    });
  });

  describe('getInitialSize', () => {
    describe('when perAlertView is false', () => {
      const perAlertView = false;
      test('when defaultSize is undefined', () => {
        const defaultSize = undefined;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(MAX_ALERT_COUNT);
      });
      test('when defaultSize is 0', () => {
        const defaultSize = 0;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(MAX_ALERT_COUNT);
      });
      test('when defaultSize is greater than 0', () => {
        const defaultSize = 10;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(MAX_ALERT_COUNT);
      });
      test('when defaultSize is less than 0', () => {
        const defaultSize = -10;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(MAX_ALERT_COUNT);
      });
    });
    describe('when perAlertView is true', () => {
      const perAlertView = true;
      test('when defaultSize is undefined', () => {
        const defaultSize = undefined;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(
          DEFAULT_GET_ALERTS_QUERY_PARAMS.size
        );
      });
      test('when defaultSize is 0', () => {
        const defaultSize = 0;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(defaultSize);
      });
      test('when defaultSize is greater than 0', () => {
        const defaultSize = 10;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(defaultSize);
      });
      test('when defaultSize is less than 0', () => {
        const defaultSize = -10;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(MAX_ALERT_COUNT);
      });
    });
    describe('when perAlertView is undefined', () => {
      const perAlertView = undefined;
      test('when defaultSize is undefined', () => {
        const defaultSize = undefined;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(MAX_ALERT_COUNT);
      });
      test('when defaultSize is 0', () => {
        const defaultSize = 0;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(MAX_ALERT_COUNT);
      });
      test('when defaultSize is greater than 0', () => {
        const defaultSize = 10;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(MAX_ALERT_COUNT);
      });
      test('when defaultSize is less than 0', () => {
        const defaultSize = -10;
        expect(getInitialSize(perAlertView, defaultSize)).toEqual(MAX_ALERT_COUNT);
      });
    });
  });

  describe('displayAcknowledgedAlertsToast', () => {
    let notifications;
    beforeEach(() => {
      notifications = _.cloneDeep(coreMock.notifications);
    });
    test('when successfulCount is less than 1', () => {
      displayAcknowledgedAlertsToast(notifications, 0);
      expect(notifications.toasts.addSuccess).toHaveBeenCalledTimes(0);
    });
    test('when successfulCount is undefined', () => {
      displayAcknowledgedAlertsToast(notifications, undefined);
      expect(notifications.toasts.addSuccess).toHaveBeenCalledTimes(0);
    });
    test('when successfulCount is 1', () => {
      displayAcknowledgedAlertsToast(notifications, 1);
      expect(notifications.toasts.addSuccess).toHaveBeenCalledWith(
        'Successfully acknowledged 1 alert.'
      );
    });
    test('when successfulCount is greater than 1', () => {
      displayAcknowledgedAlertsToast(notifications, 10);
      expect(notifications.toasts.addSuccess).toHaveBeenCalledWith(
        'Successfully acknowledged 10 alerts.'
      );
    });
  });

  describe('filterActiveAlerts', () => {
    test('with empty alerts', () => {
      const alerts = [];
      expect(filterActiveAlerts(alerts)).toEqual([]);
    });
    test('with undefined alerts', () => {
      const alerts = undefined;
      expect(filterActiveAlerts(alerts)).toEqual([]);
    });
    test('with valid alerts', () => {
      const alerts = [
        { state: ALERT_STATE.ACKNOWLEDGED },
        { state: ALERT_STATE.ACTIVE },
        { state: ALERT_STATE.ACTIVE },
        { state: ALERT_STATE.COMPLETED },
        { state: ALERT_STATE.DELETED },
        { state: ALERT_STATE.ERROR },
      ];
      const expectedOutput = [{ state: ALERT_STATE.ACTIVE }, { state: ALERT_STATE.ACTIVE }];
      expect(filterActiveAlerts(alerts)).toEqual(expectedOutput);
    });
  });

  test('getQueryObjectFromState', () => {
    const expectedOutput = {
      page: 1,
      size: 10,
      search: '',
      sortField: 'start_time',
      sortDirection: 'desc',
      severityLevel: 'ALL',
      alertState: 'ALL',
      monitorIds: ['monitor1', 'monitor2', 'monitor3'],
      flyoutIsOpen: true,
    };
    const state = {
      ...expectedOutput,
      extraField1: 'extraField1',
      extraField2: 'extraField2',
      extraField3: 'extraField3',
    };
    expect(getQueryObjectFromState(state)).toEqual(expectedOutput);
  });

  test('getURLQueryParams', () => {
    const location = {
      pathname: '/dashboard',
      search:
        '?alertState=ACKNOWLEDGED&from=0&search=searchTerm&severityLevel=5&size=10000&sortDirection=desc&sortField=start_time',
      hash: '',
    };
    const expectedOutput = {
      from: 0,
      size: 10000,
      search: 'searchTerm',
      sortField: 'start_time',
      sortDirection: 'desc',
      severityLevel: '5',
      alertState: ALERT_STATE.ACKNOWLEDGED,
    };
    expect(getURLQueryParams(location)).toEqual(expectedOutput);
  });
});
