import { useState, useEffect } from 'react';
import uuidv4 from 'uuid/v4';

export const stateToLabel = {
  enabled: { label: 'Enabled', color: 'success' },
  disabled: { label: 'Disabled', color: 'danger' },
};

export const useMonitors = () => {
  const [monitors, setMonitors] = useState<any[] | null>();

  useEffect(() => {
    const getMonitors = async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 4000);
      });

      // Fake monitors
      const newMons = [
        { name: 'CPU usage across world', state: 'enabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 2', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 3', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 4', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 5', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 6', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 7', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 8', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 9', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 10', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 11', state: 'disabled', date: Date.now(), id: uuidv4() },
        { name: 'Memory usage across world 12', state: 'disabled', date: Date.now(), id: uuidv4() },
      ];

      // Additional data for them
      newMons.forEach((mon, index) => {
        Object.assign(mon, {
          type: 'Per query monitor',
          indexes: 'sample-host-health',
          triggers: [{ name: 'example trigger' }],
          activeAlerts: index,
        });
      });

      setMonitors(newMons);
    };

    getMonitors();
  }, []);

  return monitors;
};
