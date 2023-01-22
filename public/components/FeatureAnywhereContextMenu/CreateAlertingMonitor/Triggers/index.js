import React, { useState, useEffect, useCallback } from 'react';
import {
  EuiLink,
  EuiText,
  EuiSpacer,
  EuiPanel,
  EuiIcon,
  EuiAccordion,
  EuiFormRow,
  EuiFieldText,
  EuiButton,
} from '@elastic/eui';
import SeverityLevel from './SeverityLevel';
import TriggerExpressions from '../../../../pages/CreateTrigger/components/TriggerExpressions';
import { useField, Field, FieldArray, useFormikContext } from 'formik';
import './styles.scss';
import { FORMIK_INITIAL_TRIGGER_CONDITION_VALUES } from '../../../../pages/CreateTrigger/containers/CreateTrigger/utils/constants.js';
import ConfigureActions from '../../../../pages/CreateTrigger/containers/ConfigureActions';

// Returns an objects of accordions, but the keys are indexes
const getClosedAccordions = (triggersValue, keyToOpen = -1) => {
  const newAccordions = triggersValue.reduce((acc, cur, index) => ({ ...acc, [index]: false }), {});

  if (keyToOpen !== -1 && newAccordions[keyToOpen] === false) {
    newAccordions[keyToOpen] = true;
  }

  return newAccordions;
};

const Triggers = () => {
  const { setFieldValue, values } = useFormikContext();
  const [triggers, , helpers] = useField('triggers');
  const [accordions, setAccordions] = useState(getClosedAccordions(triggers.value, 0));

  const addTrigger = () => {
    helpers.setValue([
      ...triggers.value,
      {
        ...FORMIK_INITIAL_TRIGGER_CONDITION_VALUES,
        name: `New trigger ${triggers.value.length || ''}`,
        id: Date.now(),
        severity: '1',
      },
    ]);
  };

  const removeTrigger = (index) => {
    const newTriggers = [...triggers.value];
    newTriggers.splice(index, 1);
    helpers.setValue(newTriggers);
  };

  const toggleAccordions = useCallback(
    (index) => {
      const newAccordions = getClosedAccordions(triggers.value, index);

      // If open, close, otherwise open
      if (index !== -1) {
        newAccordions[index] = !accordions[index];
      }

      setAccordions(newAccordions);
    },
    [triggers, accordions]
  );

  // Setup accordions if triggers length changes
  useEffect(() => {
    if (triggers.value.length !== Object.keys(accordions).length) {
      toggleAccordions(triggers.value.length === 1 ? 0 : -1);
    }
  }, [triggers, accordions, toggleAccordions]);

  return (
    <>
      <EuiSpacer size="s" />
      {triggers.value.map((trigger, index) => (
        <div key={trigger.id}>
          <EuiPanel>
            <EuiAccordion
              id={`triggers-${trigger.id}`}
              buttonContent={
                <EuiText>
                  <h6>{trigger.name}</h6>
                </EuiText>
              }
              forceState={accordions[index] ? 'open' : 'closed'}
              onToggle={() => toggleAccordions(index)}
              extraAction={
                <EuiButton color="danger" onClick={() => removeTrigger(index)} size="s">
                  Remove trigger
                </EuiButton>
              }
            >
              <EuiSpacer />
              <Field name={`triggers.${index}.name`}>
                {({ field, form: { touched, errors } }) => (
                  <EuiFormRow isInvalid={touched.name && !!errors.name} error={errors.name}>
                    <EuiFieldText {...{ ...field, onBlur: () => null, label: 'Name' }} />
                  </EuiFormRow>
                )}
              </Field>
              <TriggerExpressions
                {...{
                  label: 'Trigger condition',
                  keyFieldName: `triggers.${index}.thresholdEnum`,
                  valueFieldName: `triggers.${index}.thresholdValue`,
                }}
              />
              <EuiSpacer />
              <SeverityLevel
                {...{
                  value: values.triggers[index].severity,
                  onChange: (value) => setFieldValue(`triggers.${index}.severity`, value),
                }}
              />
              <EuiSpacer size="s" />
              <FieldArray name={`triggers.${index}.actions`} validateOnChange={true}>
                {(arrayHelpers) => (
                  <ConfigureActions
                    {...{
                      arrayHelpers,
                      context: {},
                      httpClient: {
                        get: () => ({}),
                      },
                      setFlyout: () => null,
                      values: [],
                      notifications: {},
                      notificationService: () => null,
                      plugins: [],
                    }}
                  />
                )}
              </FieldArray>
            </EuiAccordion>
          </EuiPanel>
          <EuiSpacer size="s" />
        </div>
      ))}
      {!triggers.value.length && (
        <>
          <EuiSpacer size="s" />
          <EuiText size="xs" textAlign="center">
            <h4>No triggers</h4>
            <p>Add a trigger to define conditions and actions.</p>
          </EuiText>
        </>
      )}
      {triggers.value.length < 10 && (
        <>
          <EuiSpacer size="s" />
          <EuiPanel paddingSize="none">
            <EuiText textAlign="center" size="s">
              <EuiLink onClick={addTrigger} className="triggers__add-trigger">
                <EuiIcon type="plusInCircle" /> Add trigger
              </EuiLink>
            </EuiText>
          </EuiPanel>
        </>
      )}
    </>
  );
};

export default Triggers;
