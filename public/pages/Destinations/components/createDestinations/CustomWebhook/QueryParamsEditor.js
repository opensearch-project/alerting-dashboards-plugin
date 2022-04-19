/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { FieldArray } from 'formik';
import AttributeEditor from '../../../../../components/AttributeEditor';
import { FormikFieldText } from '../../../../../components/FormControls';
import { isInvalid, required } from '../../../../../utils/validate';

const handleRenderKeyField = (fieldName, index, isEnabled) => (
  <FormikFieldText
    formRow={index === 0}
    fieldProps={{
      validate: isEnabled ? required : null,
    }}
    rowProps={{
      label: index === 0 ? 'Key' : null,
    }}
    inputProps={{
      isInvalid,
      disabled: !isEnabled,
    }}
    name={fieldName}
  />
);

const handleRenderValueField = (fieldName, index, isEnabled) => (
  <FormikFieldText
    formRow={index === 0}
    fieldProps={{
      validate: isEnabled ? required : null,
    }}
    rowProps={{
      label: index === 0 ? 'Value' : null,
    }}
    inputProps={{
      isInvalid,
      disabled: !isEnabled,
    }}
    name={fieldName}
  />
);

const propTypes = {
  type: PropTypes.string.isRequired,
  queryParams: PropTypes.array.isRequired,
  isEnabled: PropTypes.bool,
};

const QueryParamsEditor = ({ type, queryParams, isEnabled = true }) => (
  <FieldArray name={`${type}.queryParams`} validateOnChange={true}>
    {(arrayHelpers) => (
      <AttributeEditor
        titleText="Query parameters"
        onAdd={() => arrayHelpers.push({ key: '', value: '' })}
        onRemove={(index) => arrayHelpers.remove(index)}
        items={queryParams}
        name={`${type}.queryParams`}
        addButtonText="Add parameter"
        removeButtonText="Remove parameter"
        onRenderKeyField={handleRenderKeyField}
        onRenderValueField={handleRenderValueField}
        isEnabled={false}
      />
    )}
  </FieldArray>
);

QueryParamsEditor.propTypes = propTypes;

export default QueryParamsEditor;
