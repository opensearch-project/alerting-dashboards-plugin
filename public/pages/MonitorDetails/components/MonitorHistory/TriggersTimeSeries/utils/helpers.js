/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { TIME_SERIES_ALERT_STATE } from '../../../../containers/MonitorHistory/utils/constants';

//TODO:: Confirm text with PM / UX
export const formatTooltip = ({ meta = {}, state: dataPointState }) => {
  const formatHintDisplayDate = (date) => moment(date).format('MMM Do YYYY, h:mm A');
  if (dataPointState == TIME_SERIES_ALERT_STATE.NO_ALERTS) {
    return meta.startTime && meta.endTime
      ? [
          {
            title: 'No Alerts',
            value: `Between ${formatHintDisplayDate(meta.startTime)} and ${formatHintDisplayDate(
              meta.endTime
            )}`,
          },
        ]
      : [];
  } else {
    const alertsToolTip = [];
    alertsToolTip.push({
      title: 'Alert Started at',
      value: formatHintDisplayDate(meta.startTime),
    });

    if (meta.acknowledgedTime) {
      alertsToolTip.push({
        title: 'Alert Acknowledged at',
        value: formatHintDisplayDate(meta.acknowledgedTime),
      });
    }

    if (meta.endTime) {
      alertsToolTip.push({
        title: 'Alert Ended at',
        value: formatHintDisplayDate(meta.endTime),
      });
    }

    alertsToolTip.push({
      title: 'State',
      value: meta.state,
    });

    if (meta.errorsCount) {
      alertsToolTip.push({
        title: 'Errors',
        value: meta.errorsCount,
      });
    }

    return alertsToolTip;
  }
};

export const formatTooltipAlertCount = ({
  meta = {},
  state: dataPointState,
  x0: serieStartTime,
  x: seriesEndTime,
}) => {
  const formatHintDisplayDate = (date) => moment(date).format('MMM Do YYYY, h:mm A');
  if (dataPointState == TIME_SERIES_ALERT_STATE.NO_ALERTS) {
    return meta.startTime && meta.endTime
      ? [
          {
            title: 'No Alerts',
            value: `Between ${formatHintDisplayDate(meta.startTime)} and ${formatHintDisplayDate(
              meta.endTime
            )}`,
          },
        ]
      : [];
  } else {
    return [
      {
        title: `${formatHintDisplayDate(serieStartTime)} to  ${formatHintDisplayDate(
          seriesEndTime
        )}`,
      },
      {
        title: 'Active',
        value: meta[TIME_SERIES_ALERT_STATE.TRIGGERED],
      },
      {
        title: 'Acknowledged',
        value: meta[TIME_SERIES_ALERT_STATE.ACKNOWLEDGED],
      },
      {
        title: 'Error',
        value: meta[TIME_SERIES_ALERT_STATE.ERROR],
      },
    ];
  }
};
