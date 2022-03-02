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
 *   Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React, { useState } from 'react';
import _ from 'lodash';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCodeEditor,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiLink,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { isInvalidApiPath } from '../../../../utils/validate';
import { FormikComboBox, FormikFieldText } from '../../../../components/FormControls';
import {
  API_PATH_REQUIRED_PLACEHOLDER_TEXT,
  EMPTY_PATH_PARAMS_TEXT,
  REST_API_REFERENCE,
  API_TYPES,
} from './utils/clusterMetricsMonitorConstants';
import {
  getApiPath,
  getExamplePathParams,
  isInvalidApiPathParameter,
  validateApiPathParameter,
} from './utils/clusterMetricsMonitorHelpers';
import { FORMIK_INITIAL_VALUES } from '../../containers/CreateMonitor/utils/constants';

const setApiType = (form, apiType) => {
  const pathParams = _.get(form, 'uri.path_params', FORMIK_INITIAL_VALUES.uri.path_params);
  form.setFieldValue('uri.api_type', apiType);
  form.setFieldValue('uri.path', getApiPath(_.isEmpty(pathParams), apiType));
};

const renderModal = (closeModal, prevApiType, selectedApiType, form) => {
  const onClear = () => {
    setApiType(form, selectedApiType);
    form.setFieldValue('triggerDefinitions', []);
    closeModal();
  };
  const onKeep = () => {
    setApiType(form, selectedApiType);
    closeModal();
  };
  const onClose = () => {
    setApiType(form, prevApiType);
    closeModal();
  };
  const apiTypeLabel = _.get(API_TYPES, `${selectedApiType}.label`);
  const modalTextBody = _.isEmpty(selectedApiType)
    ? 'You are about to clear the selected request type. Would you like to clear the existing trigger conditions?'
    : `The existing trigger conditions may not be supported by request type "${apiTypeLabel}". Would you like to clear them?`;

  return (
    <EuiOverlayMask>
      <EuiModal onClose={onClose} data-test-subj={'clusterMetricsClearTriggersModal'}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>Clear all trigger conditions?</EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>{modalTextBody}</EuiModalBody>

        <EuiModalFooter>
          <EuiFlexGroup justifyContent={'flexEnd'}>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                fullWidth={false}
                onClick={onKeep}
                data-test-subj={'clusterMetricsClearTriggersModalKeepButton'}
              >
                Keep
              </EuiButtonEmpty>
            </EuiFlexItem>

            <EuiFlexItem grow={false}>
              <EuiButton
                color={'danger'}
                fill={true}
                fullWidth={false}
                onClick={onClear}
                data-test-subj={'clusterMetricsClearTriggersModalClearButton'}
              >
                Clear
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
};

const ClusterMetricsMonitor = ({
  isDarkMode,
  loadingResponse = false,
  loadingSupportedApiList = false,
  onRunQuery,
  resetResponse,
  response,
  supportedApiList = [],
  values,
}) => {
  const apiType = _.get(values, 'uri.api_type');
  const path = _.get(values, 'uri.path');
  const pathIsEmpty = _.isEmpty(path);
  const pathParams = _.get(values, 'uri.path_params', FORMIK_INITIAL_VALUES.uri.path_params);
  const supportsPathParams = !_.isEmpty(_.get(API_TYPES, `${apiType}.paths.withPathParams`));
  const requirePathParams = _.isEmpty(_.get(API_TYPES, `${apiType}.paths.withoutPathParams`));
  const hidePathParams = pathIsEmpty || loadingSupportedApiList || !supportsPathParams;
  const disableRunButton = pathIsEmpty || (_.isEmpty(pathParams) && requirePathParams);
  const hasTriggers = _.get(values, 'triggerDefinitions', []).length > 0;

  const [displayingModal, setDisplayingModal] = useState(false);
  const [clearTriggersModal, setClearTriggersModal] = useState(undefined);
  const closeModal = () => {
    setDisplayingModal(false);
    setClearTriggersModal(undefined);
  };
  const openModal = (prevApiType, selectedApiType, form) => {
    setDisplayingModal(true);
    setClearTriggersModal(renderModal(closeModal, prevApiType, selectedApiType, form));
  };

  return (
    <div>
      <EuiSpacer size={'m'} />

      <FormikComboBox
        name={'uri.api_type'}
        formRow
        rowProps={{
          label: (
            <div>
              <EuiText size={'xs'}>
                <strong>Request type</strong>
              </EuiText>
              <EuiText color={'subdued'} size={'xs'}>
                Specify a request type to monitor cluster metrics such as health, JVM, and CPU
                usage.{' '}
                <EuiLink external href={REST_API_REFERENCE} target={'_blank'}>
                  Learn more
                </EuiLink>
              </EuiText>
            </div>
          ),
          isInvalid: isInvalidApiPath,
          error: API_PATH_REQUIRED_PLACEHOLDER_TEXT,
        }}
        inputProps={{
          placeholder: loadingSupportedApiList ? 'Loading API options' : 'Select an API',
          options: supportedApiList,
          onBlur: (e, field, form) => {
            form.setFieldTouched('uri.api_type');
          },
          onChange: (options, field, form) => {
            const selectedApiType = _.get(options, '0.value');
            let changingApiType = true;
            if (selectedApiType !== apiType) {
              const doesNotUsePathParams = _.isEmpty(
                _.get(API_TYPES, `${selectedApiType}.paths.withPathParams`)
              );
              if (doesNotUsePathParams)
                form.setFieldValue('uri.path_params', FORMIK_INITIAL_VALUES.uri.path_params);
              if (hasTriggers && !_.isEmpty(apiType)) {
                changingApiType = false;
                openModal(apiType, selectedApiType, form);
              }
              resetResponse();
              form.setFieldTouched('uri.path_params', false);
            }
            if (changingApiType) setApiType(form, selectedApiType);
          },
          isClearable: true,
          singleSelection: { asPlainText: true },
          selectedOptions: !_.isEmpty(apiType)
            ? [
                {
                  value: _.get(API_TYPES, `${apiType}.type`),
                  label: _.get(API_TYPES, `${apiType}.label`),
                },
              ]
            : undefined,
          isDisabled: loadingSupportedApiList,
          isLoading: loadingSupportedApiList,
          'data-test-subj': 'clusterMetricsApiTypeComboBox',
        }}
      />

      {displayingModal && clearTriggersModal}
      <EuiSpacer size={'l'} />

      {!hidePathParams ? (
        <div>
          <FormikFieldText
            name={'uri.path_params'}
            formRow
            fieldProps={{
              validate: (value, field) =>
                validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams),
            }}
            rowProps={{
              label: (
                <div>
                  <EuiText size={'xs'}>
                    <strong>Query parameters</strong>
                    {!requirePathParams && <i> - optional </i>}
                  </EuiText>
                  <EuiText color={'subdued'} size={'xs'}>
                    Filter responses by providing path parameters for the{' '}
                    {_.get(API_TYPES, `${apiType}.label`) || 'selected'} API.{' '}
                    {!pathIsEmpty && !_.isEmpty(_.get(API_TYPES, `${apiType}.documentation`)) && (
                      <EuiLink
                        external
                        href={_.get(API_TYPES, `${apiType}.documentation`)}
                        target={'_blank'}
                      >
                        Learn more
                      </EuiLink>
                    )}
                  </EuiText>
                </div>
              ),
              style: { maxWidth: '600px' },
              isInvalid: (value, field) =>
                isInvalidApiPathParameter(field, hidePathParams, pathParams, requirePathParams),
              error: (value, field) =>
                validateApiPathParameter(field, hidePathParams, pathParams, requirePathParams),
            }}
            inputProps={{
              placeholder: pathIsEmpty ? EMPTY_PATH_PARAMS_TEXT : getExamplePathParams(apiType),
              fullWidth: true,
              prepend: (
                <EuiText
                  size={'s'}
                  style={{ backgroundColor: 'transparent', paddingRight: !hidePathParams && '0px' }}
                >
                  GET {_.get(API_TYPES, `${apiType}.prependText`)}
                </EuiText>
              ),
              append: !_.isEmpty(_.get(API_TYPES, `${apiType}.appendText`)) && (
                <EuiText
                  size={'s'}
                  style={{ backgroundColor: 'transparent', paddingLeft: !hidePathParams && '0px' }}
                >
                  {_.get(API_TYPES, `${apiType}.appendText`)}
                </EuiText>
              ),
              'data-test-subj': 'clusterMetricsParamsFieldText',
            }}
          />

          <EuiSpacer size={'l'} />
        </div>
      ) : null}

      <EuiButton
        disabled={disableRunButton}
        fill={false}
        isLoading={loadingResponse}
        onClick={onRunQuery}
        size={'s'}
        data-test-subj={'clusterMetricsPreviewButton'}
      >
        Preview query
      </EuiButton>

      <EuiSpacer size={'l'} />

      <EuiFormRow label={'Response'} fullWidth={true}>
        <EuiCodeEditor
          mode={'json'}
          theme={isDarkMode ? 'sense-dark' : 'github'}
          height={'500px'}
          width={'100%'}
          value={pathIsEmpty || loadingResponse ? undefined : response}
          readOnly
          data-test-subj={'clusterMetricsRunResponseBox'}
        />
      </EuiFormRow>
    </div>
  );
};

export default ClusterMetricsMonitor;