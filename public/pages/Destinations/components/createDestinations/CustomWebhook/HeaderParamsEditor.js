/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FieldArray } from 'formik';
import AttributeEditor from '../../../../../components/AttributeEditor';
import SubHeader from '../../../../../components/SubHeader';
import { FormikFieldText } from '../../../../../components/FormControls';
import { hasError, isInvalid, required } from '../../../../../utils/validate';

const handleRenderKeyField = (fieldName, index) => (
  <FormikFieldText
    formRow={index === 0}
    fieldProps={{
      validate: required,
    }}
    rowProps={{
      label: index === 0 ? 'Key' : null,
      isInvalid,
      error: hasError,
    }}
    inputProps={{
      isInvalid,
      disabled: false,
    }}
    name={fieldName}
  />
);

const handleRenderValueField = (fieldName, index) => (
  <FormikFieldText
    formRow={index === 0}
    fieldProps={{
      validate: required,
    }}
    rowProps={{
      label: index === 0 ? 'Value' : null,
    }}
    inputProps={{
      isInvalid,
    }}
    name={fieldName}
  />
);

const propTypes = {
  type: PropTypes.string.isRequired,
  headerParams: PropTypes.array.isRequired,
};
const HeaderParamsEditor = ({ type, headerParams }) => (
  <Fragment>
    <SubHeader title={<h6>Header information</h6>} description={''} />
    <FieldArray name={`${type}.headerParams`} validateOnChange={true}>
      {(arrayHelpers) => (
        <AttributeEditor
          onAdd={() => arrayHelpers.push({ key: '', value: '' })}
          onRemove={(index) => index !== 0 && arrayHelpers.remove(index)}
          items={headerParams}
          name={`${type}.headerParams`}
          addButtonText="Add header"
          removeButtonText="Remove header"
          onRenderKeyField={handleRenderKeyField}
          onRenderValueField={handleRenderValueField}
        />
      )}
    </FieldArray>
  </Fragment>
);

HeaderParamsEditor.propTypes = propTypes;

export default HeaderParamsEditor;
