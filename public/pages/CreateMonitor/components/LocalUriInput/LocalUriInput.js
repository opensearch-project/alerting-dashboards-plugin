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
  EuiCodeEditor,
  EuiConfirmModal,
  EuiFormRow,
  EuiLink,
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
} from './utils/localUriConstants';
import {
  getApiPath,
  getExamplePathParams,
  isInvalidApiPathParameter,
  validateApiPathParameter,
} from './utils/localUriHelpers';
import { FORMIK_INITIAL_VALUES } from '../../containers/CreateMonitor/utils/constants';

const renderModal = (closeModal, prevApiType, currApiType, values) => {
  const onConfirm = () => {
    _.set(values, 'triggerDefinitions', []);
    closeModal();
  };
  const prevApiLabel = _.get(API_TYPES, `${prevApiType}.label`, prevApiType);
  const currApiLabel = _.get(API_TYPES, `${currApiType}.label`, currApiType);
  const message = _.isEmpty(currApiType)
    ? `You are clearing the request type "${prevApiLabel}".`
    : `You are changing the request type from "${prevApiLabel}" to "${currApiLabel}".`;
  return (
    <EuiOverlayMask onClick={closeModal}>
      <EuiConfirmModal
        onCancel={closeModal}
        onConfirm={onConfirm}
        confirmButtonText={'Clear all trigger conditions?'}
        cancelButtonText={'Keep current trigger conditions?'}
        defaultFocusedButton={'cancel'}
        buttonColor={'danger'}
        title={message}
      ></EuiConfirmModal>
    </EuiOverlayMask>
  );
};

const LocalUriInput = ({
  isDarkMode,
  loadingResponse = false,
  loadingSupportedApiList = false,
  onRunQuery,
  resetResponse,
  response,
  supportedApiList = [],
  values,
}) => {
  const [displayingModal, setDisplayingModal] = useState(false);
  const [modal, setModal] = useState(undefined);
  const closeModal = () => {
    setDisplayingModal(false);
    setModal(undefined);
  };
  const openModal = (prevApiType, currApiType) => {
    setDisplayingModal(true);
    setModal(renderModal(closeModal, prevApiType, currApiType, values));
  };
  const apiType = _.get(values, 'uri.api_type');
  const path = _.get(values, 'uri.path');
  const pathIsEmpty = _.isEmpty(path);
  const pathParams = _.get(values, 'uri.path_params', FORMIK_INITIAL_VALUES.uri.path_params);
  const supportsPathParams = !_.isEmpty(_.get(API_TYPES, `${apiType}.paths.withPathParams`));
  const requirePathParams = _.isEmpty(_.get(API_TYPES, `${apiType}.paths.withoutPathParams`));
  const hidePathParams = pathIsEmpty || loadingSupportedApiList || !supportsPathParams;
  const disableRunButton = pathIsEmpty || (_.isEmpty(pathParams) && requirePathParams);
  const hasTriggers = _.get(values, 'triggerDefinitions', []).length > 0;
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
            if (selectedApiType !== apiType) {
              const doesNotUsePathParams = _.isEmpty(
                _.get(API_TYPES, `${selectedApiType}.paths.withPathParams`)
              );
              if (doesNotUsePathParams)
                form.setFieldValue('uri.path_params', FORMIK_INITIAL_VALUES.uri.path_params);
              resetResponse();
              form.setFieldTouched('uri.path_params', false);
              if (hasTriggers && !_.isEmpty(apiType)) openModal(apiType, selectedApiType);
            }
            form.setFieldValue('uri.api_type', selectedApiType);
            form.setFieldValue('uri.path', getApiPath(_.isEmpty(pathParams), selectedApiType));
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
          'data-test-subj': 'localUriApiTypeComboBox',
        }}
      />

      {displayingModal && modal}
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
              'data-test-subj': 'localUriPathParamsFieldText',
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
        data-test-subj={'localUriRunButton'}
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
          data-test-subj={'localUriRunResponseBox'}
        />
      </EuiFormRow>
    </div>
  );
};

export default LocalUriInput;
