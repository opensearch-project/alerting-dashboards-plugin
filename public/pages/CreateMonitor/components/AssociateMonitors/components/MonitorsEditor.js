/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { FormikCodeEditor } from '../../../../../components/FormControls';

const MonitorsEditor = ({ values, isDarkMode, errors }) => {
  const codeFieldName = 'associatedMonitorsEditor';
  const formikValueName = 'associatedMonitors';
  const [editorValue, setEditorValue] = useState('');

  useEffect(() => {
    try {
      const code = JSON.stringify(values.associatedMonitors, null, 4);
      _.set(values, codeFieldName, code);
      setEditorValue(code);
    } catch (e) {}
  }, [values.associatedMonitors]);

  const onCodeChange = (codeValue, field, form) => {
    form.setFieldValue(codeFieldName, codeValue);
    form.setFieldTouched(codeFieldName, true);
    setEditorValue(codeValue);

    try {
      const code = JSON.parse(codeValue); // test the code before setting it to formik
      form.setFieldValue(formikValueName, code);
    } catch (e) {
      console.error('Invalid json.');
    }
  };

  const isInvalid = (name, form) => {
    try {
      const associatedMonitors = form.values[name];
      const json = JSON.parse(associatedMonitors);
      return !json.sequence?.delegates?.length || json.sequence?.delegates?.length < 2;
    } catch (e) {
      return true;
    }
  };

  const hasError = (name, form) => {
    const associatedMonitors = form.values[name];
    return validate(associatedMonitors);
  };

  const validate = (value) => {
    try {
      const json = JSON.parse(value);
      if (!json.sequence?.delegates?.length || json.sequence?.delegates?.length < 2) {
        return 'Delegates list can not be empty or have less then two associated monitors.';
      }
    } catch (e) {
      return 'Invalid json.';
    }
  };

  return (
    <FormikCodeEditor
      name={codeFieldName}
      formRow
      fieldProps={{
        validate: validate,
      }}
      rowProps={{
        label: 'Define workflow',
        fullWidth: true,
        isInvalid: (name, form) => form.touched[codeFieldName] && isInvalid(name, form),
        error: hasError,
      }}
      inputProps={{
        isInvalid: (name, form) => isInvalid(name, form),
        mode: 'json',
        width: '80%',
        height: '300px',
        theme: isDarkMode ? 'sense-dark' : 'github',
        onChange: onCodeChange,
        onBlur: (e, field, form) => form.setFieldTouched(codeFieldName, true),
        value: editorValue,
        'data-test-subj': codeFieldName,
      }}
    />
  );
};

export default MonitorsEditor;
