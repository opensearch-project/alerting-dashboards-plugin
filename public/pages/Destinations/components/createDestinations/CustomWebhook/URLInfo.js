/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  FormikFieldText,
  FormikSelect,
  FormikFieldNumber,
  FormikFieldRadio,
} from '../../../../../components/FormControls';
import { hasError, isInvalid, required } from '../../../../../utils/validate';
import { validateUrl, validateHost } from './validate';
import { URL_TYPE } from '../../../containers/CreateDestination/utils/constants';
import { formikInitialValues } from '../../../containers/CreateDestination/utils/constants';
import { DESTINATION_TYPE } from '../../../utils/constants';
import QueryParamsEditor from './QueryParamsEditor';

const propTypes = {
  type: PropTypes.string.isRequired,
  values: PropTypes.object.isRequired,
};
const protocolOptions = [
  { value: 'HTTPS', text: 'HTTPS' },
  { value: 'HTTP', text: 'HTTP' },
];

const URLInfo = ({ type, values }) => {
  const isUrlEnabled = values[type].urlType === URL_TYPE.FULL_URL;
  return (
    <Fragment>
      <FormikFieldRadio
        name={`${type}.urlType`}
        formRow
        inputProps={{
          id: 'fullUrl',
          value: URL_TYPE.FULL_URL,
          checked: isUrlEnabled,
          label: 'Define endpoint by URL',
          onChange: (e, field, form) => {
            // Clear Custom URL if user switched to custom URL
            if (field.value === URL_TYPE.ATTRIBUTE_URL) {
              const customValues = {
                ...values,
                [type]: {
                  ...values[type],
                  scheme: '',
                  host: '',
                  port: '',
                  path: '',
                  queryParams: formikInitialValues[DESTINATION_TYPE.CUSTOM_HOOK].queryParams,
                },
              };
              form.setTouched({
                [type]: {
                  scheme: false,
                  host: false,
                  port: false,
                  path: false,
                },
              });
              form.setValues(customValues);
            }
            field.onChange(e);
          },
          disabled: true,
        }}
      />
      <FormikFieldText
        name={`${type}.url`}
        formRow
        fieldProps={{
          validate: (fieldValue) => validateUrl(fieldValue, values),
        }}
        rowProps={{
          label: 'Webhook URL',
          style: { paddingLeft: '10px' },
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          disabled: true,
          isInvalid,
          // 'validateUrl()' is only called onBlur, but we enable the basic 'required()' validation onChange
          onChange: (e, field, form) => {
            field.onChange(e);
            form.setFieldError(`${type}.url`, required(e.target.value));
          },
        }}
      />
      <FormikFieldRadio
        name={`${type}.urlType`}
        formRow
        value="customUrl"
        inputProps={{
          id: 'customUrl',
          value: URL_TYPE.ATTRIBUTE_URL,
          checked: !isUrlEnabled,
          label: 'Define endpoint by custom attributes URL',
          onChange: (e, field, form) => {
            // Clear Full URL if user switched to custom URL
            if (field.value === URL_TYPE.FULL_URL) {
              form.setFieldTouched(`${type}.url`, false, false);
              form.setFieldValue(`${type}.url`, '');
            }
            field.onChange(e);
          },
          disabled: true,
        }}
      />
      <FormikSelect
        name={`${type}.scheme`}
        formRow
        rowProps={{
          label: 'Type',
          style: { paddingLeft: '10px' },
        }}
        inputProps={{
          disabled: true,
          options: protocolOptions,
        }}
      />
      <FormikFieldText
        name={`${type}.host`}
        formRow
        fieldProps={{
          validate: (fieldValue) => validateHost(fieldValue, values),
        }}
        rowProps={{
          label: 'Host',
          style: { paddingLeft: '10px' },
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          disabled: true,
          isInvalid,
          // 'validateHost()' is only called onBlur, but we enable the basic 'required()' validation onChange
          onChange: (e, field, form) => {
            field.onChange(e);
            form.setFieldError(`${type}.host`, required(e.target.value));
          },
        }}
      />
      <FormikFieldNumber
        name={`${type}.port`}
        formRow
        rowProps={{
          label: 'Port',
          style: { paddingLeft: '10px' },
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          disabled: true,
          isInvalid,
        }}
      />
      <FormikFieldText
        name={`${type}.path`}
        formRow
        rowProps={{
          label: 'Path',
          style: { paddingLeft: '10px' },
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          disabled: true,
          isInvalid,
        }}
      />
      <QueryParamsEditor type={type} queryParams={values[type].queryParams} isEnabled={false} />
    </Fragment>
  );
};

URLInfo.propTypes = propTypes;

export default URLInfo;
