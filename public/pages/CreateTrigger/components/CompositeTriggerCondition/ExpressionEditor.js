import React, { useEffect, useState } from 'react';
import * as _ from 'lodash';
import { FormikCodeEditor } from '../../../../components/FormControls';

const ExpressionEditor = ({ values, formikFieldName, formikFieldPath, isDarkMode = false }) => {
  const [editorValue, setEditorValue] = useState('');
  const formikFullFieldName = `${formikFieldPath}${formikFieldName}`;
  const formikFullCodeFieldName = _.replace(`${formikFullFieldName}_code`, /[.\[\]]/gm, '_');

  useEffect(() => {
    const code = _.get(values, formikFullFieldName, '');
    _.set(values, formikFullCodeFieldName, code);
    setEditorValue(code);
  }, [values]);

  const isInvalid = (name, form) => !form.values[name]?.length;

  const hasError = (name, form) => {
    return !form.values[name]?.length && 'Invalid condition.';
  };

  const validate = (value) => {
    if (!value?.length) return 'Invalid condition.';
  };

  return (
    <FormikCodeEditor
      name={formikFullCodeFieldName}
      formRow
      fieldProps={{
        validate: validate,
      }}
      rowProps={{
        label: 'Trigger condition',
        fullWidth: true,
        isInvalid: (name, form) => form.touched[name] && isInvalid(name, form),
        error: (name, form) => hasError(name, form),
      }}
      inputProps={{
        isInvalid: (name, form) => form.touched[name] && isInvalid(name, form),
        mode: 'text',
        width: '80%',
        height: '300px',
        theme: isDarkMode ? 'sense-dark' : 'github',
        value: editorValue,
        onChange: (code, field, form) => {
          form.setFieldTouched(formikFullCodeFieldName, true);
          form.setFieldValue(formikFullFieldName, code);
          form.setFieldValue(formikFullCodeFieldName, code);
        },
        onBlur: (e, field, form) => form.setFieldTouched(field.name, true),
        'data-test-subj': 'compositeTriggerConditionEditor',
      }}
    />
  );
};

export default ExpressionEditor;
