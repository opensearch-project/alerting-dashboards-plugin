import React, { useState } from 'react';
import {
  EuiText,
  EuiHorizontalRule,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiAccordion,
} from '@elastic/eui';
import { views, useMonitorFrequencyText } from '../helpers';
import './styles.scss';
import { useField } from 'formik';
import MonitorDetails from './MonitorDetails';
import Advanced from './Advanced';
import Triggers from './Triggers';
import { EmbeddablePanel } from '../../../../../../src/plugins/embeddable/public';

const accordions = ['monitorDetails', 'advanced', 'triggers'].reduce(
  (acc, cur) => ({ ...acc, [cur]: cur }),
  {}
);

const CreateAlertingMonitorExpanded = ({ setView, context }) => {
  const [accordionOpen, setAccordionOpen] = useState(accordions.triggers);
  const [name] = useField('name');
  const [frequency] = useField('frequency');
  const [interval] = useField('period.interval');
  const [unit] = useField('period.unit');
  const monitorFrequencyText = useMonitorFrequencyText({ frequency, interval, unit });

  return (
    <EuiFlyout
      ownFocus
      onClose={() => setView(views.home)}
      aria-labelledby="create-alerting-monitor-expanded"
      size="l"
      className="create-alerting-monitor-expanded"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle>
          <h2 id="create-alerting-monitor-expanded__title">Create alerting monitor</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div className="create-alerting-monitor-expanded__vis">
              <EmbeddablePanel
                hideHeader={false}
                embeddable={context.embeddable}
                getActions={() => Promise.resolve([])}
                getAllEmbeddableFactories={() => []}
                getEmbeddableFactory={() => null}
                notifications={{}}
                application={{}}
                overlays={{}}
                inspector={{ isAvailable: () => null }}
                SavedObjectFinder={() => null}
              />
            </div>
          </EuiFlexItem>
          <EuiFlexItem className="create-alerting-monitor-expanded__aside">
            <EuiAccordion
              id={accordions.monitorDetails}
              buttonContent={
                <EuiText>
                  <h6>Monitor Details</h6>
                  {accordionOpen !== accordions.monitorDetails && (
                    <>
                      <EuiText size="s">{name.value}</EuiText>
                      <EuiText size="xs" color="subdued">
                        {monitorFrequencyText}
                      </EuiText>
                    </>
                  )}
                </EuiText>
              }
              forceState={accordionOpen === accordions.monitorDetails ? 'open' : 'closed'}
              onToggle={() =>
                setAccordionOpen(
                  accordionOpen !== accordions.monitorDetails && accordions.monitorDetails
                )
              }
            >
              <MonitorDetails />
            </EuiAccordion>
            <EuiHorizontalRule margin="s" />
            <EuiAccordion
              id={accordions.monitorDetails}
              buttonContent={
                <EuiText>
                  <h6>Advanced Data Source Settings</h6>
                </EuiText>
              }
              forceState={accordionOpen === accordions.advanced ? 'open' : 'closed'}
              onToggle={() =>
                setAccordionOpen(accordionOpen !== accordions.advanced && accordions.advanced)
              }
            >
              <Advanced />
            </EuiAccordion>
            <EuiHorizontalRule margin="s" />
            <EuiAccordion
              id={accordions.triggers}
              buttonContent={
                <EuiText>
                  <h6>Triggers</h6>
                </EuiText>
              }
              forceState={accordionOpen === accordions.triggers ? 'open' : 'closed'}
              onToggle={() =>
                setAccordionOpen(accordionOpen !== accordions.triggers && accordions.triggers)
              }
            >
              <Triggers />
            </EuiAccordion>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};

export default CreateAlertingMonitorExpanded;
