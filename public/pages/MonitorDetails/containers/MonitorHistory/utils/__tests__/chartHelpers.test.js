/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment-timezone';
import { generateFirstDataPoints, dataPointsGenerator, getPOISearchQuery } from '../chartHelpers';

moment.tz.setDefault('America/Los_Angeles');

describe('Chart Helpers', () => {
  describe('getPOISearchQuery', () => {
    it('Generates SearchQuery for the POI Graph', () => {
      const startTime = moment('2018-10-29T09:00:00').valueOf();
      const endTime = moment('2018-10-29T10:00:00').valueOf();
      const intervalDuration = moment.duration(10, 'm');
      expect(
        getPOISearchQuery('monitorId', startTime, endTime, intervalDuration)
      ).toMatchSnapshot();
    });
  });
  describe('Time Series', () => {
    const windowTime = {
      startTime: moment('2018-10-29T09:00:00').valueOf(),
      endTime: moment('2018-10-29T10:00:00').valueOf(),
    };
    const alertInputData = {
      startTime: moment('2018-10-29T09:15:00').valueOf(),
      acknowledgedTime: moment('2018-10-29T09:17:00').valueOf(),
      endTime: moment('2018-10-29T09:18:00').valueOf(),
      windowEndTime: windowTime.endTime,
    };
    describe('generateFirstDataPoints should generate correct data point for an alert', () => {
      test('started inside window range', () => {
        expect(
          generateFirstDataPoints({
            ...alertInputData,
            state: 'COMPLETED',
            windowStartTime: windowTime.startTime,
            windowEndTime: windowTime.endTime,
            errorsCount: 0,
          })
        ).toMatchSnapshot();
      });
      test('started outside window range', () => {
        expect(
          generateFirstDataPoints({
            ...alertInputData,
            startTime: moment('2018-10-29T08:55:00').valueOf(),
            state: 'COMPLETED',
            windowStartTime: windowTime.startTime,
            windowEndTime: windowTime.endTime,
            errorsCount: 5,
          })
        ).toMatchSnapshot();
      });
    });
    describe('dataPointsGenerator should generate correct data point for an alert', () => {
      it('inside window range', () => {
        const dataPoints = dataPointsGenerator({
          ...alertInputData,
          acknowledgedTime: null,
          meta: {
            metaKey: 'metaValue',
          },
        });
        expect(dataPoints).toMatchSnapshot();
      });

      it('has acknowledged_time', () => {
        const dataPoints = dataPointsGenerator({
          ...alertInputData,
          meta: {
            metaKey: 'metaValue',
          },
        });
        expect(dataPoints).toMatchSnapshot();
      });

      it('has an acknowledged_time outside window range', () => {
        const dataPoints = dataPointsGenerator({
          ...alertInputData,
          acknowledgedTime: moment('2018-10-29T10:01:00').valueOf(),
          meta: {
            metaKey: 'metaValue',
          },
        });
        expect(dataPoints).toMatchSnapshot();
      });

      it('has an end_time outside window range', () => {
        const dataPoints = dataPointsGenerator({
          ...alertInputData,
          acknowledgedTime: null,
          endTime: moment('2018-10-29T10:01:00').valueOf(),
          meta: {
            metaKey: 'metaValue',
          },
        });
        expect(dataPoints).toMatchSnapshot();
      });

      it('if previous end time has been provided generate no_alert state', () => {
        const dataPoints = dataPointsGenerator({
          ...alertInputData,
          lastEndTime: windowTime.startTime,
          meta: {
            metaKey: 'metaValue',
          },
        });
        expect(dataPoints).toMatchSnapshot();
      });
    });
  });
});
