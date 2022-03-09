/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCodeEditor, EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import 'brace/mode/json';
import 'brace/mode/plain_text';
import 'brace/snippets/javascript';
import 'brace/ext/language_tools';

import { FormikCodeEditor } from '../../../../components/FormControls';
import { isInvalid, hasError, validateExtractionQuery } from '../../../../utils/validate';

const ExtractionQuery = ({ isDarkMode, response }) => (
  <EuiFlexGroup>
    <EuiFlexItem>
      <FormikCodeEditor
        name="query"
        formRow
        fieldProps={{ validate: validateExtractionQuery }}
        rowProps={{
          label: 'Define extraction query',
          fullWidth: true,
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          mode: 'json',
          width: '100%',
          height: '500px',
          theme: isDarkMode ? 'sense-dark' : 'github',
          onChange: (query, field, form) => {
            form.setFieldValue('query', query);
          },
          onBlur: (e, field, form) => {
            form.setFieldTouched('query', true);
          },
          'data-test-subj': 'extractionQueryCodeEditor',
        }}
      />
    </EuiFlexItem>
    <EuiFlexItem>
      <EuiFormRow label="Extraction query response" fullWidth>
        <EuiCodeEditor
          mode="json"
          theme={isDarkMode ? 'sense-dark' : 'github'}
          width="100%"
          height="500px"
          value={response}
          readOnly
        />
      </EuiFormRow>
    </EuiFlexItem>
  </EuiFlexGroup>
);

export default ExtractionQuery;
