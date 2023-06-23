/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FormikCodeEditor } from '../../../../../components/FormControls';
import { hasError, isInvalid, validateExtractionQuery } from '../../../../../utils/validate';

const MonitorsEditor = ({ values, isDarkMode }) => {
  const codeFieldName = 'associatedMonitorsEditor';
  const formikValueName = 'associatedMonitors';
  const [editorValue, setEditorValue] = useState('');

  useEffect(() => {
    try {
      const code = JSON.stringify(values.associatedMonitors, null, 4);
      // _.set(values, codeFieldName, code);
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
    if (form.touched[codeFieldName]) {
      try {
        const associatedMonitors = form.values[name];
        const json = JSON.parse(associatedMonitors);
        return !json.sequence?.delegates?.length;
      } catch (e) {
        return false;
      }
    }
  };

  const hasError = (name, form) => {
    try {
      const associatedMonitors = form.values[name];
      const json = JSON.parse(associatedMonitors);
      return (
        json.sequence?.delegates?.length < 2 &&
        'Delegates list can not be empty or have less then two associated monitors.'
      );
    } catch (e) {
      return 'Invalid json.';
    }
  };

  return (
    <FormikCodeEditor
      name={codeFieldName}
      formRow
      fieldProps={{}}
      rowProps={{
        label: 'Define workflow',
        fullWidth: true,
        // isInvalid: (name, form) => isInvalid(name, form),
        // error: (name, form) => hasError(name, form),
      }}
      inputProps={{
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
