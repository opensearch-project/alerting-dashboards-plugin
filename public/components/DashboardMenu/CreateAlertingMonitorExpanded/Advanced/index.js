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
import MonitorExpressions from '../../../../pages/CreateMonitor/components/MonitorExpressions';

const Advanced = () => (
  <>
    <EuiSpacer />
    <MonitorExpressions {...{ dataTypes: {}, errors: {} }} />
    <EuiSpacer size="s" />
    <EuiButton onClick={() => {}} fullWidth size="s">
      Preview query and performance
    </EuiButton>
  </>
);

export default Advanced;
