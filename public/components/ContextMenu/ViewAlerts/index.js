import React from 'react';
import {
  EuiText,
  EuiHorizontalRule,
  EuiPanel,
  EuiListGroup,
  EuiListGroupItem,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiSpacer,
  EuiCallOut,
  EuiIcon,
  EuiFacetButton,
} from '@elastic/eui';
import { dateOptions } from '../../../utils/getContextMenuData/helpers';
import './styles.scss';

const statusToSev = {
  danger: 1,
  warning: 3,
  success: 4,
};

const ViewAlerts = ({ alerts }) => (
  <EuiFlexGroup className="view-alerts" direction="column" gutterSize="none">
    <EuiFlexItem grow>
      <EuiListGroup gutterSize="none" className="view-alerts__list">
        {alerts.map((alert, index) => (
          <div key={alert.id}>
            {index !== 0 && <EuiHorizontalRule margin="none" />}
            <EuiListGroupItem
              className="view-alerts__item"
              label={
                <EuiPanel color="transparent" hasBorder={false} paddingSize="s">
                  <EuiFlexGroup
                    className="view-alerts__actions"
                    justifyContent="spaceBetween"
                    alignItems="center"
                  >
                    <EuiFlexItem grow={false}>
                      <EuiCallOut color={alert.status} className="view-alerts__sev">
                        Sev{statusToSev[alert.status]}
                      </EuiCallOut>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">
                        {alert.name}
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiSpacer size="s" />
                  <EuiText size="s">
                    <strong>{alert.trigger}</strong> is above {Math.round(alert.percentAbove * 100)}
                    %
                  </EuiText>
                  <EuiSpacer size="s" />
                  <EuiFlexGroup
                    className="view-alerts__actions"
                    justifyContent="spaceBetween"
                    alignItems="center"
                  >
                    <EuiFlexItem grow={false}>
                      <EuiFacetButton quantity={alert.alarms} onClick={() => null}>
                        <EuiIcon type="bell" />
                      </EuiFacetButton>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">
                        last: {new Intl.DateTimeFormat('default', dateOptions).format(alert.last)}
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              }
            />
          </div>
        ))}
      </EuiListGroup>
    </EuiFlexItem>
    <EuiFlexItem grow={false}>
      <EuiHorizontalRule margin="none" />
      <EuiButtonEmpty onClick={() => {}} className="view-alerts__acknowledge">
        Acknowledge all
      </EuiButtonEmpty>
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default ViewAlerts;
