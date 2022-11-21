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
import { useField, useFormikContext } from 'formik';
import Notifications from '../Notifications';
import SeverityLevel from '../SeverityLevel';
import CreateAlertingMonitorExpanded from '../CreateAlertingMonitorExpanded';
import FormikWrapper from '../FormikWrapper';
import './styles.scss';
import TriggerExpressions from '../../../pages/CreateTrigger/components/TriggerExpressions';
import { toMountPoint } from '../../../../../../src/plugins/opensearch_dashboards_react/public';

const CreateAlertingMonitor = (props) => {
  const { overlays, closeMenu } = props;
  const { values } = useFormikContext();
  const [name] = useField('name');
  const onOpenAdvanced = () => {
    // Prepare advanced flyout with new formik provider of current values
    const getFormikOptions = () => ({
      initialValues: values,
      onSubmit: (values) => {
        console.log(values);
      },
    });

    const flyout = overlays.openFlyout(
      toMountPoint(
        <FormikWrapper {...{ getFormikOptions }}>
          <CreateAlertingMonitorExpanded {...{ ...props, onClose: () => flyout.close() }} />
        </FormikWrapper>
      )
    );

    // Close context menu
    closeMenu();
  };

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
              <EuiLink onClick={onOpenAdvanced}>
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
