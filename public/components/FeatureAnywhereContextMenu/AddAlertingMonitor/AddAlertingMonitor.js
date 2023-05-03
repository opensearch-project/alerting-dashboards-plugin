/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiTitle,
  EuiSpacer,
  EuiButton,
  EuiButtonEmpty,
  EuiFormFieldset,
  EuiCheckableCard,
} from '@elastic/eui';
import './styles.scss';
import CreateNew from './CreateNew';
import AssociateExisting from './AssociateExisting';
import _ from 'lodash';
import { Formik } from 'formik';
import {
  getInitialValues,
  submit,
} from '../../../pages/CreateMonitor/containers/CreateMonitor/utils/helpers';
import { createSavedObjectAssociation } from './utils';
import { SEARCH_TYPE } from '../../../utils/constants';

function AddAlertingMonitor({
  embeddable,
  closeFlyout,
  core,
  flyoutMode,
  setFlyoutMode,
  monitors,
  selectedMonitorId,
  setSelectedMonitorId,
  index,
  detectorId,
}) {
  const history = {
    location: { pathname: '/create-monitor', search: '', hash: '', state: undefined },
    push: () => null,
    goBack: closeFlyout,
  };
  const setFlyout = () => null;
  const { notifications, http: httpClient } = core;
  const title = embeddable.getTitle();
  const timeField = embeddable.vis?.data?.aggs?.aggs?.[1]?.params?.field?.displayName;
  const searchType = flyoutMode === 'adMonitor' ? SEARCH_TYPE.AD : '';
  const initialValues = useMemo(
    () =>
      getInitialValues({ ...history, title, index, timeField, flyoutMode, searchType, detectorId }),
    []
  );
  const onCreate = (values, formikBag) =>
    submit({
      values,
      formikBag,
      history,
      updateMonitor: () => null,
      notifications,
      httpClient,
      onSuccess: async ({ monitorId }) => {
        await createSavedObjectAssociation(monitorId, embeddable.vis.id);
        closeFlyout();
      },
    });
  const onAssociateExisting = async () => {
    // create saved object or dispatch an event that will create the obj
    const res = await createSavedObjectAssociation(selectedMonitorId, embeddable.vis.id);

    if (res) {
      closeFlyout();
    }
  };
  const onSubmit = async ({ handleSubmit, validateForm }) => {
    if (['create', 'adMonitor'].includes(flyoutMode)) {
      const errors = await validateForm();

      if (Object.keys(errors).length > 0) {
        // Delay to allow errors to render
        setTimeout(() => {
          document
            .querySelector('.euiFlyoutBody__overflow')
            .scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
      }

      handleSubmit();
    } else if (flyoutMode === 'existing') {
      onAssociateExisting();
    }
  };

  return (
    <div className="add-alerting-monitor">
      <Formik initialValues={initialValues} onSubmit={onCreate} validateOnChange={false}>
        {(formikProps) => {
          const { handleSubmit, isSubmitting, validateForm } = formikProps;

          return (
            <>
              <EuiFlyoutHeader hasBorder>
                <EuiTitle>
                  <h2 id="add-alerting-monitor__title">
                    {flyoutMode === 'adMonitor' ? 'Set up alerts' : 'Add alerting monitor'}
                  </h2>
                </EuiTitle>
              </EuiFlyoutHeader>
              <EuiFlyoutBody>
                <div className="add-alerting-monitor__scroll">
                  {flyoutMode !== 'adMonitor' && (
                    <>
                      <EuiFormFieldset
                        legend={{
                          display: 'hidden',
                          children: (
                            <EuiTitle>
                              <span>
                                Options to create a new monitor or associate an existing monitor
                              </span>
                            </EuiTitle>
                          ),
                        }}
                        className="add-alerting-monitor__modes"
                      >
                        {[
                          {
                            id: 'add-alerting-monitor__create',
                            label: 'Create new monitor',
                            value: 'create',
                          },
                          {
                            id: 'add-alerting-monitor__existing',
                            label: 'Associate existing monitor',
                            value: 'existing',
                          },
                        ].map((option) => (
                          <EuiCheckableCard
                            {...{
                              ...option,
                              key: option.id,
                              name: option.id,
                              checked: option.value === flyoutMode,
                              onChange: () => setFlyoutMode(option.value),
                            }}
                          />
                        ))}
                      </EuiFormFieldset>
                      <EuiSpacer size="m" />
                    </>
                  )}
                  {['create', 'adMonitor'].includes(flyoutMode) && (
                    <CreateNew
                      {...{
                        embeddable,
                        core,
                        flyoutMode,
                        formikProps,
                        history,
                        setFlyout,
                        detectorId,
                      }}
                    />
                  )}
                  {flyoutMode === 'existing' && (
                    <AssociateExisting {...{ monitors, selectedMonitorId, setSelectedMonitorId }} />
                  )}
                  <EuiSpacer size="l" />
                </div>
              </EuiFlyoutBody>
              <EuiFlyoutFooter>
                <EuiFlexGroup justifyContent="spaceBetween">
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty onClick={closeFlyout}>Cancel</EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      onClick={() => onSubmit({ handleSubmit, validateForm })}
                      fill
                      isLoading={isSubmitting}
                    >
                      {flyoutMode === 'existing' ? 'Associate' : 'Create'} monitor
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlyoutFooter>
            </>
          );
        }}
      </Formik>
    </div>
  );
}

export default AddAlertingMonitor;
