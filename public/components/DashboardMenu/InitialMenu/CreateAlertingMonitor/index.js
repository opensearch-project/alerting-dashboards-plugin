import React from 'react';
import {
  EuiLink,
  EuiText,
  EuiHorizontalRule,
  EuiSpacer,
  EuiPanel,
  EuiIcon,
  EuiToolTip,
  EuiFlexItem,
  EuiFlexGroup,
  EuiButton,
} from '@elastic/eui';
import { useField } from 'formik';
import { views } from '../../helpers';
import Notifications from '../../common/Notifications';
import SeverityLevel from '../../common/SeverityLevel';
import './styles.scss';
import TriggerExpressions from '../../../../pages/CreateTrigger/components/TriggerExpressions';

const CreateAlertingMonitor = ({ setView }) => {
  const [name] = useField('name');

  return (
    <>
      <EuiPanel hasBorder={false} hasShadow={false}>
        <EuiText size="s">
          <strong>{name.value}</strong>
        </EuiText>
        <EuiSpacer size="xs" />
        <EuiText size="xs">
          Runs every 10 minutes{' '}
          <EuiToolTip position="left" content="Extra info here">
            <EuiLink href="#">
              <EuiIcon type="questionInCircle" />
            </EuiLink>
          </EuiToolTip>
        </EuiText>
        <EuiSpacer />
        <TriggerExpressions
          {...{
            label: 'Trigger condition',
            keyFieldName: 'thresholdEnum',
            valueFieldName: 'thresholdValue',
          }}
        />
        <EuiSpacer />
        <SeverityLevel />
        <Notifications />
      </EuiPanel>
      <EuiHorizontalRule margin="none" />
      <EuiPanel hasBorder={false} hasShadow={false}>
        <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
          <EuiFlexItem>
            <EuiText size="s">
              <EuiLink onClick={() => setView(views.createAlertingMonitorExpanded)}>
                <EuiIcon type="menuLeft" /> Advanced settings
              </EuiLink>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiButton
              className="create-alerting-monitor__create"
              fill
              size="s"
              onClick={() => console.log('create')}
            >
              Create
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </>
  );
};

export default CreateAlertingMonitor;
