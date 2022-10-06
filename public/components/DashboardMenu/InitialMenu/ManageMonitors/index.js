import React from 'react';
import {
  EuiLink,
  EuiText,
  EuiHorizontalRule,
  EuiPanel,
  EuiHealth,
  EuiListGroup,
  EuiListGroupItem,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSpacer,
} from '@elastic/eui';
import { views, dateOptions } from '../../helpers';
import './index.scss';

const ManageMonitors = ({ monitors, setView }) => (
  <EuiListGroup gutterSize="none" className="manage-monitors">
    {monitors.map((monitor) => (
      <div key={monitor.id}>
        <EuiListGroupItem
          className="manage-monitors__item"
          label={
            <EuiPanel color="transparent" hasBorder={false} paddingSize="s">
              <EuiText size="s">
                <strong>
                  <EuiHealth textSize="inherit" color={monitor.status}>
                    {monitor.name}
                  </EuiHealth>
                </strong>
              </EuiText>
              <EuiSpacer size="s" />
              <div className="manage-monitors__time">
                <EuiText size="xs">
                  last alert: {new Intl.DateTimeFormat('default', dateOptions).format(monitor.last)}
                </EuiText>
              </div>
              <EuiFlexGroup
                className="manage-monitors__actions"
                justifyContent="spaceBetween"
                alignItems="center"
              >
                <EuiFlexItem grow={false}>
                  <EuiText size="s">
                    <EuiLink onClick={() => console.log('disable')}>Disable</EuiLink>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton
                    className="manage-monitors__edit-monitor"
                    fill
                    size="s"
                    onClick={() => setView(views.manageMonitor)}
                  >
                    Edit Monitor
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          }
        />
        <EuiHorizontalRule margin="none" />
      </div>
    ))}
  </EuiListGroup>
);

export default ManageMonitors;
