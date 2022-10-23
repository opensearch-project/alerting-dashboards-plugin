import React from 'react';
import { EuiLink, EuiText, EuiSpacer, EuiPanel, EuiIcon, EuiFormRow } from '@elastic/eui';

const Notifications = () => (
  <>
    <EuiFormRow label="Notifications">
      <EuiPanel color="subdued" hasBorder={false} hasShadow={false}>
        <EuiText size="xs">
          The alert will appear on the visualization when the trigger content is met.
        </EuiText>
      </EuiPanel>
    </EuiFormRow>
    <EuiSpacer size="s" />
    <EuiPanel color="subdued" hasBorder={false} hasShadow={false}>
      <EuiText size="s">
        <EuiLink href="#">
          <EuiIcon type="plusInCircle" /> Add channel notification
        </EuiLink>
      </EuiText>
    </EuiPanel>
  </>
);

export default Notifications;
