import React, { useState } from 'react';
import InitialMenu from './InitialMenu';
import CreateAlertingMonitorExpanded from './CreateAlertingMonitorExpanded';
import { getInitialMonitors, views, getInitialAlerts, getInitialValues } from './helpers';
import { useFormik, FormikProvider } from 'formik';

const DashboardMenu = ({ context }) => {
  const [view, setView] = useState(views.createAlertingMonitorExpanded);
  const [alerts, setAlerts] = useState(getInitialAlerts());
  const [monitors, setMonitors] = useState(getInitialMonitors());
  const formik = useFormik({
    initialValues: getInitialValues(),
    onSubmit: (values) => {
      console.log(values);
    },
  });
  let child = <InitialMenu {...{ setMonitors, setView, monitors, alerts, setAlerts }} />;

  if (view === views.createAlertingMonitorExpanded) {
    child = <CreateAlertingMonitorExpanded {...{ setView, context }} />;
  }

  return <FormikProvider value={formik}>{child}</FormikProvider>;
};

export default DashboardMenu;
