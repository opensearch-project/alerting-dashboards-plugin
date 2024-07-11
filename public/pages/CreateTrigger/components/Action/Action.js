/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import _ from 'lodash';
import {
  EuiAccordion,
  EuiSmallButton,
  EuiButton,
  EuiHorizontalRule,
  EuiPanel,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSmallButtonIcon,
  EuiButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { FormikFieldText, FormikComboBox } from '../../../../components/FormControls';
import { isInvalid, hasError, validateActionName } from '../../../../utils/validate';
import { validateDestination } from './utils/validate';
import {
  DEFAULT_ACTION_TYPE,
  webhookNotificationActionMessageComponent,
  defaultNotificationActionMessageComponent,
} from '../../utils/constants';
import NotificationsCallOut from '../NotificationsCallOut';
import MinimalAccordion from '../../../../components/FeatureAnywhereContextMenu/MinimalAccordion';
import { getManageChannelsUrl } from '../../../../utils/helpers';

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
  fieldPath,
  values,
  hasNotificationPlugin,
  loadDestinations,
  flyoutMode,
  accordionProps = {},
  isInitialLoading,
}) => {
  const [backupValues, setBackupValues] = useState();
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const ManageButton = useMemo(() => (flyoutMode ? EuiButtonEmpty : EuiSmallButton), [flyoutMode]);
  const Accordion = useMemo(() => (flyoutMode ? MinimalAccordion : EuiAccordion), [flyoutMode]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const selectedDestination = flattenedDestinations.filter(
    (item) => item.value === action.destination_id
  );
  const type = _.get(selectedDestination, '0.type', DEFAULT_ACTION_TYPE);
  const { name } = action;
  let ActionComponent;
  const actionLabel = 'Notification';
  if (type === 'webhook') {
    ActionComponent = webhookNotificationActionMessageComponent;
  } else {
    ActionComponent = defaultNotificationActionMessageComponent;
  }

  const isFirstAction = index !== undefined && index === 0;
  const refreshDestinations = useMemo(() => {
    const refresh = async () => {
      setLoadingDestinations(true);
      await loadDestinations();
      setLoadingDestinations(false);
    };
    return _.debounce(refresh, 2000, { leading: true, trailing: false });
  }, []);
  const onConfigureOpen = () => {
    setIsConfigureOpen(true);
    setBackupValues(_.cloneDeep(values));
  };
  // Reset the form, because the user wants to restore the backup settings,
  // rather than just close the popup and keep the changes they have made.
  const onConfigureCancel = () => {
    setIsConfigureOpen(false);
    arrayHelpers.form.resetForm({ values: backupValues });
  };
  // Close and retain changes if no errors related to the fields involved
  const onConfigureUpdate = async () => {
    const errors = await arrayHelpers.form.validateForm();

    if (Object.keys(errors).length === 0) {
      setIsConfigureOpen(false);
      return;
    }

    const pathsToFields = ['subject_template.source', 'message_template.source'];

    // Mark fields in popup as touched
    pathsToFields.forEach((path) =>
      arrayHelpers.form.setFieldTouched(`${fieldPath}actions[${index}].${path}`)
    );

    const isErrorInConfigure = pathsToFields.find((path) =>
      _.get(errors, `${fieldPath}actions[${index}].${path}`, '')
    );

    if (!isErrorInConfigure) {
      setIsConfigureOpen(false);
    }
  };

  const renderChannels = () => {
    return (
      <div>
        <EuiFlexGroup wrap>
          <EuiFlexItem style={{ maxWidth: 400 }}>
            <FormikComboBox
              name={`${fieldPath}actions.${index}.destination_id`}
              formRow
              fieldProps={{ validate: validateDestination(flattenedDestinations, flyoutMode) }}
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
                onFocus: refreshDestinations,
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
                rowHeight: 30,
                isLoading: !flyoutMode && loadingDestinations,
              }}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSpacer size="l" />
            <ManageButton
              disabled={!hasNotificationPlugin}
              iconType="popout"
              iconSide="right"
              onClick={() => window.open(getManageChannelsUrl())}
            >
              Manage channels
            </ManageButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        {!hasNotificationPlugin && <NotificationsCallOut />}
      </div>
    );
  };

  return (
    <div style={flyoutMode ? {} : { paddingTop: isFirstAction ? undefined : '20px' }}>
      <EuiPanel
        styles={{ backgroundColor: '#FFFFFF' }}
        hasBorder={!flyoutMode}
        hasShadow={!flyoutMode}
        paddingSize={flyoutMode ? 'none' : 'm'}
      >
        <Accordion
          {...(flyoutMode
            ? {
                id: name,
                title: name,
                extraAction: (
                  <EuiSmallButtonIcon
                    iconType="trash"
                    color="text"
                    aria-label={`Delete Notification`}
                    onClick={onDelete}
                  />
                ),
                ...accordionProps,
              }
            : {
                id: name,
                initialIsOpen: !name,
                className: 'accordion-action',
                buttonContent: (
                  <EuiText>
                    {!_.get(selectedDestination, '0.type', undefined)
                      ? 'Notification'
                      : `${actionLabel}: ${name}`}
                  </EuiText>
                ),
                extraAction: (
                  <EuiButton color={'danger'} onClick={onDelete} size={'s'}>
                    Remove action
                  </EuiButton>
                ),
                paddingSize: 's',
              })}
        >
          {!flyoutMode && <EuiHorizontalRule margin="s" />}
          <div
            style={
              flyoutMode ? {} : { paddingLeft: '20px', paddingRight: '20px', paddingTop: '10px' }
            }
          >
            {!flyoutMode && (
              <>
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
              </>
            )}
            {(!flyoutMode || !isInitialLoading) && renderChannels()}
            {flyoutMode && isInitialLoading && <EuiLoadingSpinner size="l" />}
            {!flyoutMode && (
              <ActionComponent
                action={action}
                context={context}
                index={index}
                sendTestMessage={sendTestMessage}
                setFlyout={setFlyout}
                fieldPath={fieldPath}
                values={values}
              />
            )}
            {flyoutMode && !isInitialLoading && (
              <>
                <EuiButtonEmpty iconType="pencil" iconSide="left" onClick={onConfigureOpen}>
                  Configure notification
                </EuiButtonEmpty>
                {isConfigureOpen && (
                  <EuiModal onClose={onConfigureCancel}>
                    <EuiModalHeader>
                      <EuiModalHeaderTitle>
                        <h1>Configure notification</h1>
                      </EuiModalHeaderTitle>
                    </EuiModalHeader>
                    <EuiModalBody>
                      <ActionComponent
                        action={action}
                        context={context}
                        index={index}
                        sendTestMessage={sendTestMessage}
                        setFlyout={setFlyout}
                        fieldPath={fieldPath}
                        values={values}
                      />
                    </EuiModalBody>
                    <EuiModalFooter>
                      <EuiSmallButton onClick={onConfigureCancel}>Cancel</EuiSmallButton>
                      <EuiSmallButton onClick={onConfigureUpdate} fill>
                        Update
                      </EuiSmallButton>
                    </EuiModalFooter>
                  </EuiModal>
                )}
              </>
            )}
          </div>
        </Accordion>
        {flyoutMode && <EuiHorizontalRule margin="s" />}
      </EuiPanel>
    </div>
  );
};

export default Action;
