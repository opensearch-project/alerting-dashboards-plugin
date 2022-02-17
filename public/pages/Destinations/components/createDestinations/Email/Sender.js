/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiAccordion, EuiButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import {
  FormikFieldText,
  FormikFieldNumber,
  FormikSelect,
} from '../../../../../components/FormControls';
import { isInvalid, hasError } from '../../../../../utils/validate';
import { validateEmail, validateHost, validatePort, validateSenderName } from './utils/validate';
import { METHOD_TYPE, STATE } from './utils/constants';

const methodOptions = [
  { value: METHOD_TYPE.NONE, text: 'None' },
  { value: METHOD_TYPE.SSL, text: 'SSL' },
  { value: METHOD_TYPE.TLS, text: 'TLS' },
];

const onSenderChange = (index, sender, arrayHelpers) => {
  // Checking for id here since new senders should not be marked as updated
  // Also will not replace the sender state if it has already been marked as updated
  if (sender.id && sender.state !== STATE.UPDATED) {
    arrayHelpers.replace(index, {
      ...sender,
      state: STATE.UPDATED,
    });
  }
};

const Sender = ({ sender, arrayHelpers, context, index, onDelete }) => {
  const { name } = sender;
  return (
    <EuiAccordion
      id={name}
      buttonContent={!name ? 'New sender' : name}
      paddingSize="l"
      extraAction={
        <EuiButton color="danger" size="s" onClick={onDelete}>
          Remove sender
        </EuiButton>
      }
    >
      <FormikFieldText
        name={`senders.${index}.name`}
        formRow
        fieldProps={{ validate: validateSenderName(context.ctx.senders) }}
        rowProps={{
          label: 'Sender name',
          helpText:
            'A unique and descriptive name that is easy to search. ' +
            'Valid characters are upper and lowercase a-z, 0-9, and _ (underscore).',
          style: { padding: '10px 0px' },
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          placeholder: 'my_sender',
          onChange: (e, field, form) => {
            field.onChange(e);
            onSenderChange(index, sender, arrayHelpers);
          },
          isInvalid,
        }}
      />
      <EuiFlexGroup
        alignItems="baseline"
        justifyContent="flexStart"
        style={{ padding: '10px 0px' }}
      >
        <EuiFlexItem grow={false}>
          <FormikFieldText
            name={`senders.${index}.email`}
            formRow
            fieldProps={{ validate: validateEmail }}
            rowProps={{
              label: 'Email address',
              isInvalid,
              error: hasError,
            }}
            inputProps={{
              placeholder: 'username@xxx.com',
              onChange: (e, field, form) => {
                field.onChange(e);
                onSenderChange(index, sender, arrayHelpers);
              },
              isInvalid,
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <FormikFieldText
            name={`senders.${index}.host`}
            formRow
            fieldProps={{ validate: validateHost }}
            rowProps={{
              label: 'Host',
              isInvalid,
              error: hasError,
            }}
            inputProps={{
              placeholder: 'smtp.xxx.com',
              onChange: (e, field, form) => {
                field.onChange(e);
                onSenderChange(index, sender, arrayHelpers);
              },
              isInvalid,
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <FormikFieldNumber
            name={`senders.${index}.port`}
            formRow
            fieldProps={{ validate: validatePort }}
            rowProps={{
              label: 'Port',
              isInvalid,
              error: hasError,
            }}
            inputProps={{
              placeholder: '25',
              onChange: (e, field, form) => {
                field.onChange(e);
                onSenderChange(index, sender, arrayHelpers);
              },
              isInvalid,
            }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <FormikSelect
        name={`senders.${index}.method`}
        formRow
        rowProps={{
          label: 'Encryption method',
          helpText: `SSL or TLS is recommended for security.
          SSL and TLS requires validation by adding the following fields to the Opensearch keystore:
          plugins.alerting.destination.email.${!name ? '[sender name]' : name}.username
          plugins.alerting.destination.email.${!name ? '[sender name]' : name}.password`,
          style: { padding: '10px 0px' },
        }}
        inputProps={{
          options: methodOptions,
          onChange: (e, field, form) => {
            field.onChange(e);
            onSenderChange(index, sender, arrayHelpers);
          },
        }}
      />
    </EuiAccordion>
  );
};

export default Sender;
