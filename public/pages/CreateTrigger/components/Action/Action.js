/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React from 'react';
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
  flattenDestinations,
  index,
  onDelete,
  sendTestMessage,
  setFlyout,
  httpClient,
  fieldPath,
  values,
  hasNotificationPlugin,
}) => {
  const selectedDestination = flattenDestinations.filter(
    (item) => item.value === action.destination_id
  );
  const type = _.get(selectedDestination, '0.type', DEFAULT_ACTION_TYPE);
  const { name } = action;
  const ActionComponent = ActionsMap[type].component;
  const actionLabel = ActionsMap[type].label;
  const manageChannelsUrl = httpClient.basePath.prepend(MANAGE_CHANNELS_PATH);
  const isFirstAction = index !== undefined && index === 0;

  const renderChannels = () => {
    return (
      <div>
        <EuiFlexGroup wrap>
          <EuiFlexItem style={{ maxWidth: 400 }}>
            <FormikComboBox
              name={`${fieldPath}actions.${index}.destination_id`}
              formRow
              fieldProps={{ validate: validateDestination(flattenDestinations) }}
              rowProps={{
                label: 'Channels',
                isInvalid,
                error: hasError,
              }}
              inputProps={{
                placeholder: 'Select channels to notify',
                options: destinations,
                selectedOptions: selectedDestination,
                isDisabled: !hasNotificationPlugin,
                onChange: (options) => {
                  // Just a swap correct fields.
                  arrayHelpers.replace(index, {
                    ...action,
                    destination_id: options[0].value,
                  });
                },
                onBlur: (e, field, form) => {
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
