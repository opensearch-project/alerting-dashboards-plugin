import React, { useState } from 'react';
import AssociatedMonitors from '../AssociatedMonitors';

const Container = ({ startingPanel, ...props }) => {
  const [panel, setPanel] = useState(startingPanel);
  const Panel = {
    associated: AssociatedMonitors,
    add: () => <div />,
  }[panel];

  return <Panel {...{ setPanel, ...props }} />;
};

export default Container;
