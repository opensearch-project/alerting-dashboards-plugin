import { useMemo } from 'react';
import { unitOptions as intervalUnitOptions } from '../../pages/CreateMonitor/components/Schedule/Frequencies/Interval';
import { FORMIK_INITIAL_VALUES } from '../../pages/CreateMonitor/containers/CreateMonitor/utils/constants';
import { FORMIK_INITIAL_TRIGGER_CONDITION_VALUES } from '../../pages/CreateTrigger/containers/CreateTrigger/utils/constants';

export const getInitialMonitors = () => [
  { name: 'Some monitor', last: Date.now(), status: 'success', id: 1 },
  { name: 'Another monitor here', last: Date.now(), status: 'warning', id: 2 },
  { name: 'Additional monitor', last: Date.now(), status: 'danger', id: 3 },
];

// export const getInitialAlerts = () => [];
export const getInitialAlerts = () => [
  {
    name: 'Some_alert',
    trigger: 'Some trigger',
    last: Date.now(),
    status: 'success',
    id: 1,
    percentAbove: 0.844,
    alarms: 2,
  },
  {
    name: 'Another_alert_here',
    trigger: 'Another trigger here',
    last: Date.now(),
    status: 'warning',
    id: 2,
    percentAbove: 0.8,
    alarms: 10,
  },
  {
    name: 'Additional_alert',
    trigger: 'Additional trigger',
    last: Date.now(),
    status: 'danger',
    id: 3,
    percentAbove: 0.82,
    alarms: 12,
  },
  {
    name: 'Additional_alert 2',
    trigger: 'Additional trigger',
    last: Date.now(),
    status: 'danger',
    id: 4,
    percentAbove: 0.82,
    alarms: 12,
  },
  {
    name: 'Additional_alert 3',
    trigger: 'Additional trigger',
    last: Date.now(),
    status: 'danger',
    id: 5,
    percentAbove: 0.82,
    alarms: 12,
  },
  {
    name: 'Additional_alert 4',
    trigger: 'Additional trigger',
    last: Date.now(),
    status: 'danger',
    id: 6,
    percentAbove: 0.82,
    alarms: 12,
  },
  {
    name: 'Additional_alert 5',
    trigger: 'Additional trigger',
    last: Date.now(),
    status: 'danger',
    id: 7,
    percentAbove: 0.82,
    alarms: 12,
  },
  {
    name: 'Additional_alert 6',
    trigger: 'Additional trigger',
    last: Date.now(),
    status: 'danger',
    id: 8,
    percentAbove: 0.82,
    alarms: 12,
  },
];

export const getInitialValues = () => ({
  ...{ ...FORMIK_INITIAL_VALUES, name: 'Monitor 1' },
  triggers: [
    {
      ...FORMIK_INITIAL_TRIGGER_CONDITION_VALUES,
      name: 'New trigger',
      id: Date.now(),
      severity: '1',
    },
  ],
  monitors: getInitialMonitors(),
  alerts: getInitialAlerts(),
});

export const dateOptions = {
  year: '2-digit',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: true,
  timeZone: 'America/Los_Angeles',
};

export const useMonitorFrequencyText = ({ frequency, interval, unit }) => {
  const text = useMemo(() => {
    switch (frequency.value) {
      case 'interval':
        intervalUnitOptions;
        const unitOption = intervalUnitOptions.find(({ value }) => value === unit.value);

        if (!unitOption) {
          return '';
        }

        return `Runs every ${interval.value} ${unitOption.text}`;
      default:
        return '';
    }
  }, [frequency, interval, unit]);

  return text;
};
