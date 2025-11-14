/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import moment from 'moment-timezone';

import { weekdays } from './constants';

import { DEFAULT_EMPTY_DATA } from '../../../../../utils/constants';

export default function getScheduleFromMonitor(monitor) {
  /*
    This is solving for these cases:
    If there is metadata, show human friendly meta data
    If there is no metadata, then monitor was created through API or API updated a UI Monitor which blew away metadata
    So show period or cron in schedule (whichever exists)
  */
  try {
    const uiMetadata = _.get(monitor, 'ui_metadata');
    if (uiMetadata) {
      const scheduleMetadata = _.get(uiMetadata, 'schedule', {});
      const {
        frequency,
        period = {},
        daily,
        weekly,
        monthly = {},
        cronExpression,
        timezone,
      } = scheduleMetadata;
      
      const { interval, unit } = period;
      const { day } = monthly;

      if (frequency === 'interval' && interval && unit) {
        return `Every ${interval} ${unit.toLowerCase()}`;
      }
      if (frequency === 'daily' && typeof daily === 'number' && timezone) {
        return `Every day around ${moment.tz(timezone).hours(daily).minutes(0).format('h:mm a z')}`;
      }
      if (frequency === 'weekly' && weekly && typeof daily === 'number' && timezone) {
        const daysOfWeek = Object.entries(weekly)
          .filter(([day, checked]) => checked)
          .map(([day]) => day);
        const fullDays = _.intersectionWith(
          weekdays,
          daysOfWeek,
          (arrVal, otherVal) => arrVal.abbr === otherVal
        )
          .map((weekday) => weekday.full)
          .join(', ');
        return `Every ${fullDays} around ${moment
          .tz(timezone)
          .hours(daily)
          .minutes(0)
          .format('h:mm a z')}`;
      }
      if (frequency === 'monthly' && day && typeof daily === 'number' && timezone) {
        return `Every month on the ${moment(day, 'DD').format('Do')} around ${moment
          .tz(timezone)
          .hours(daily)
          .minutes(0)
          .format('h:mm a z')}`;
      }
      if (frequency === 'cronExpression' && cronExpression) {
        return cronExpression;
      }
    }

    const period = _.get(monitor, 'schedule.period');
    if (period) {
      return `Every ${period.interval} ${period.unit.toLowerCase()}`;
    }
    const cron = _.get(monitor, 'schedule.cron');
    if (cron) {
      return `${cron.expression} ${cron.timezone}`;
    }
  } catch (err) {
    return DEFAULT_EMPTY_DATA;
  }
  return DEFAULT_EMPTY_DATA;
}
