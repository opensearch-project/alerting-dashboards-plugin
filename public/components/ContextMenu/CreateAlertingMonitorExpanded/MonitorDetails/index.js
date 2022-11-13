import React from 'react';
import {
  EuiContextMenu,
  EuiLink,
  EuiText,
  EuiHorizontalRule,
  EuiCallOut,
  EuiSpacer,
  EuiPanel,
  EuiIcon,
  EuiToolTip,
  EuiSelect,
  EuiForm,
  EuiFormRow,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFieldText,
  EuiFilterGroup,
  EuiFilterButton,
  EuiButton,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiAccordion,
} from '@elastic/eui';
import {
  Frequency,
  FrequencyPicker,
} from '../../../../pages/CreateMonitor/components/Schedule/Frequencies';
import { useField } from 'formik';

const MonitorDetails = () => {
  const [name] = useField('name');

  return (
    <>
      <EuiSpacer />
      <EuiFormRow label="Monitor name">
        <EuiFieldText {...{ ...name, placeholder: 'Monitor name' }} />
      </EuiFormRow>
      <EuiSpacer />
      <Frequency />
      <EuiSpacer size="s" />
      <FrequencyPicker />
    </>
  );
};

export default MonitorDetails;
