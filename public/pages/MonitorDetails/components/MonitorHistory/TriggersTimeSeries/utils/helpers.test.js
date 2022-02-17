/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { TIME_SERIES_ALERT_STATE } from '../../../../containers/MonitorHistory/utils/constants';
import { formatTooltip } from './helpers';

describe('Helpers', () => {
  describe('formatToolTip should generate tool tip', () => {
    const dataPointMetaData = {
      startTime: moment('2018-10-29T09:15:00').valueOf(),
      acknowledgedTime: moment('2018-10-29T09:17:00').valueOf(),
      endTime: moment('2018-10-29T09:18:00').valueOf(),
    };
    test('for NO_ALERTS state', () => {
      expect(
        formatTooltip({
          meta: {
            ...dataPointMetaData,
            acknowledgedTime: null,
          },
          state: TIME_SERIES_ALERT_STATE.NO_ALERTS,
        })
      ).toMatchSnapshot();
    });
    test('with TRIGGERED state', () => {
      expect(
        formatTooltip({
          meta: {
            ...dataPointMetaData,
            acknowledgedTime: null,
            state: 'COMPLETED',
          },
          state: TIME_SERIES_ALERT_STATE.TRIGGERED,
        })
      ).toMatchSnapshot();
    });
    test('with Acknowledge Time', () => {
      expect(
        formatTooltip({
          meta: {
            ...dataPointMetaData,
            state: 'COMPLETED',
          },
          state: TIME_SERIES_ALERT_STATE.ACKNOWLEDGED,
        })
      ).toMatchSnapshot();
    });
    test('with an Active Alert ', () => {
      expect(
        formatTooltip({
          meta: {
            ...dataPointMetaData,
            endTime: null,
            state: 'ACTIVE',
          },
          state: TIME_SERIES_ALERT_STATE.ACKNOWLEDGED,
        })
      ).toMatchSnapshot();
    });
  });
});
