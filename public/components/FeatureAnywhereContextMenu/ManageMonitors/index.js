import React from 'react';
import {
  EuiFlyoutHeader,
  EuiTitle,
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
  EuiIcon,
} from '@elastic/eui';
import './styles.scss';

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

const ManageMonitors = ({ embeddable }) => {
  const monitors = [];
  const title = embeddable.getTitle();

  return (
    <div className="manage-monitors">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2 id="create-alerting-monitor__title">Manage monitors</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiPanel color="transparent" hasBorder={false} paddingSize="m">
        <EuiText>
          <h4>
            <EuiFlexGroup gutterSize="m">
              <EuiFlexItem grow={false}>
                <EuiIcon type="visualizeApp" />
              </EuiFlexItem>
              <EuiFlexItem>
                <span className="manage-monitors__sub-header">{title}</span>
              </EuiFlexItem>
            </EuiFlexGroup>
          </h4>
        </EuiText>
      </EuiPanel>
      {monitors.length === 0 && (
        <EuiPanel color="transparent" hasBorder={false} paddingSize="m">
          <EuiText>No monitors to display</EuiText>
        </EuiPanel>
      )}
      {monitors.length !== 0 && (
        <EuiListGroup gutterSize="none">
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
                        last alert:{' '}
                        {new Intl.DateTimeFormat('default', dateOptions).format(monitor.last)}
                      </EuiText>
                    </div>
                    <EuiFlexGroup
                      className="manage-monitors__actions"
                      justifyContent="spaceBetween"
                      alignItems="center"
                    >
                      <EuiFlexItem grow={false}>
                        <EuiButton
                          className="manage-monitors__compressed-button"
                          fill
                          size="s"
                          color="danger"
                          onClick={() => null}
                        >
                          Unlink Monitor
                        </EuiButton>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButton
                          className="manage-monitors__compressed-button"
                          fill
                          size="s"
                          onClick={() => null}
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
      )}
    </div>
  );
};

export default ManageMonitors;
