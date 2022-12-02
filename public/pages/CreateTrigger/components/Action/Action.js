/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import _ from 'lodash';
import {
  EuiAccordion,
  EuiButton,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import { FormikFieldText, FormikComboBox } from '../../../../components/FormControls';
import { isInvalid, hasError, validateActionName } from '../../../../utils/validate';
import { ActionsMap } from './utils/constants';
import { validateDestination } from './utils/validate';
import { DEFAULT_ACTION_TYPE, MANAGE_CHANNELS_PATH } from '../../utils/constants';
import NotificationsCallOut from '../NotificationsCallOut';

const Action = ({
  action,
  arrayHelpers,
  context,
  destinations,
  flattenedDestinations,
  index,
  onDelete,
  sendTestMessage,
  setFlyout,
  httpClient,
  fieldPath,
  values,
  hasNotificationPlugin,
  loadDestinations,
}) => {
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const selectedDestination = flattenedDestinations.filter(
    (item) => item.value === action.destination_id
  );
  const type = _.get(selectedDestination, '0.type', DEFAULT_ACTION_TYPE);
  const { name } = action;
  const ActionComponent = ActionsMap[type].component;
  const actionLabel = ActionsMap[type].label;
  const manageChannelsUrl = httpClient.basePath.prepend(MANAGE_CHANNELS_PATH);
  const isFirstAction = index !== undefined && index === 0;

  async function refreshDestinations() {
    setLoadingDestinations(true);
    await loadDestinations();
    setLoadingDestinations(false);
  }

  const renderChannels = () => {
    return (
      <div>
        <EuiFlexGroup wrap>
          <EuiFlexItem style={{ maxWidth: 400 }}>
            <FormikComboBox
              name={`${fieldPath}actions.${index}.destination_id`}
              formRow
              fieldProps={{ validate: validateDestination(flattenedDestinations) }}
              rowProps={{
                label: 'Channels',
                isInvalid,
                error: hasError,
              }}
              inputProps={{
                placeholder: 'Select channel to notify',
                options: destinations,
                selectedOptions: selectedDestination,
                isDisabled: !hasNotificationPlugin,
                onChange: (options) => {
                  // Just a swap correct fields.
                  arrayHelpers.replace(index, {
                    ...action,
                    destination_id: options[0]?.value,
                  });
                },
                onBlur: (e, field, form) => {
                  refreshDestinations();
                  form.setFieldTouched(`${fieldPath}actions.${index}.destination_id`, true);
                },
                singleSelection: { asPlainText: true },
                isClearable: false,
                renderOption: (option) => (
                  <React.Fragment>
                    <EuiText size="s">{option.label}</EuiText>
                    <EuiText size="xs" color="subdued">
                      {option.description}
                    </EuiText>
                  </React.Fragment>
                ),
                rowHeight: 45,
                isLoading: loadingDestinations,
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSpacer size="l" />
            <EuiButton
              disabled={!hasNotificationPlugin}
              iconType="popout"
              iconSide="right"
              onClick={() => window.open(manageChannelsUrl)}
            >
              Manage channels
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        {!hasNotificationPlugin && <NotificationsCallOut />}
      </div>
    );
  };

  return (
    <div style={{ paddingTop: isFirstAction ? undefined : '20px' }}>
      <EuiPanel styles={{ backgroundColor: '#FFFFFF' }}>
        <EuiAccordion
          id={name}
          initialIsOpen={!name}
          className="accordion-action"
          buttonContent={
            <EuiText>
              {!_.get(selectedDestination, '0.type', undefined)
                ? 'Notification'
                : `${actionLabel}: ${name}`}
            </EuiText>
          }
          extraAction={
            <EuiButton color={'danger'} onClick={onDelete} size={'s'}>
              Remove action
            </EuiButton>
          }
          paddingSize={'s'}
        >
          <EuiHorizontalRule margin="s" />
          <div style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '10px' }}>
            <FormikFieldText
              name={`${fieldPath}actions.${index}.name`}
              formRow
              fieldProps={{
                validate: validateActionName(context.ctx.monitor, context.ctx.trigger),
              }}
              rowProps={{
                label: 'Action name',
                helpText: 'Names can only contain letters, numbers, and special characters',
                isInvalid,
                error: hasError,
              }}
              inputProps={{
                placeholder: 'Enter action name',
                isInvalid,
              }}
            />
            <EuiSpacer size="m" />
            {renderChannels()}
            <ActionComponent
              action={action}
              context={context}
              index={index}
              sendTestMessage={sendTestMessage}
              setFlyout={setFlyout}
              fieldPath={fieldPath}
              values={values}
            />
          </div>
        </EuiAccordion>
      </EuiPanel>
    </div>
  );
};

export default Action;
