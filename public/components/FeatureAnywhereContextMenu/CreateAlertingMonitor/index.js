import React, { useState } from 'react';
import {
  EuiText,
  EuiHorizontalRule,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiAccordion,
} from '@elastic/eui';
import { useMonitorFrequencyText } from '../../../utils/contextMenu/helpers';
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

function CreateAlertingMonitor({ embeddable }) {
  const [accordionOpen, setAccordionOpen] = useState(accordions.triggers);
  const [name] = useField('name');
  const [frequency] = useField('frequency');
  const [interval] = useField('period.interval');
  const [unit] = useField('period.unit');
  const monitorFrequencyText = useMonitorFrequencyText({ frequency, interval, unit });

  return (
    <div className="create-alerting-monitor">
      <EuiFlyoutHeader hasBorder>
        <EuiTitle>
          <h2 id="create-alerting-monitor__title">Create alerting monitor</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiFlexGroup>
          <EuiFlexItem>
            <div className="create-alerting-monitor__vis">
              <EmbeddablePanel
                hideHeader
                embeddable={embeddable}
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
          <EuiFlexItem className="create-alerting-monitor__aside">
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
    </div>
  );
}

export default CreateAlertingMonitor;
