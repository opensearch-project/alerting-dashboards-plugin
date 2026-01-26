/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import moment from 'moment-timezone';
import { weekdays } from './constants';
import { DEFAULT_EMPTY_DATA } from '../../../../../utils/constants';

const formatTime = (hours, timezone) => {
  if (hours === undefined || timezone === undefined) {
    return DEFAULT_EMPTY_DATA;
  }

  return moment.tz(timezone).hours(hours).minutes(0).format('h:mm a z');
};

const formatFrequency = (schedule = {}) => {
  const {
    frequency,
    period = {},
    daily,
    weekly,
    monthly = {},
    cronExpression,
    timezone,
  } = schedule;

  const { interval, unit } = period;
  const { day } = monthly;

  switch (frequency) {
    case 'interval':
      if (interval && unit) {
        return `Every ${interval} ${unit.toLowerCase()}`;
      }
      break;
    case 'daily':
      return `Every day around ${formatTime(daily, timezone)}`;
    case 'weekly': {
      const daysOfWeek = Object.entries(weekly || {})
        .filter(([_, checked]) => checked)
        .map(([dayKey]) => dayKey);
      const fullDays = _.intersectionWith(
        weekdays,
        daysOfWeek,
        (arrVal, otherVal) => arrVal.abbr === otherVal
      )
        .map((weekday) => weekday.full)
        .join(', ');
      if (fullDays) {
        return `Every ${fullDays} around ${formatTime(daily, timezone)}`;
      }
      break;
    }
    case 'monthly':
      if (day !== undefined) {
        return `Every month on the ${moment(day, 'DD').format('Do')} around ${formatTime(
          daily,
          timezone
        )}`;
      }
      break;
    case 'cronExpression':
      if (cronExpression) {
        return cronExpression;
      }
      break;
    default:
      break;
  }

  return DEFAULT_EMPTY_DATA;
};

export default function getScheduleFromPplMonitor(monitor = {}) {
  try {
    const schedule = _.get(monitor, 'schedule');
    if (schedule) {
      const formatted = formatFrequency(schedule);
      if (formatted !== DEFAULT_EMPTY_DATA) {
        return formatted;
      }
    }

    const period = _.get(monitor, 'schedule.period');
    if (period) {
      return `Every ${period.interval} ${period.unit?.toLowerCase?.() || ''}`.trim();
    }
    const cron = _.get(monitor, 'schedule.cron');
    if (cron) {
      return `${cron.expression} ${cron.timezone}`.trim();
    }
  } catch (err) {
    return DEFAULT_EMPTY_DATA;
  }

  return DEFAULT_EMPTY_DATA;
}
