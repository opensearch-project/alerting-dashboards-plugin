/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { connect } from 'formik';
import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiSpacer } from '@elastic/eui';
import { FormikComboBox, FormikFieldText, FormikSelect } from '../../../../components/FormControls';
import {
  hasError,
  isInvalid,
  required,
  validateIllegalCharacters,
} from '../../../../utils/validate';
import ConfigureDocumentLevelQueryTags from './ConfigureDocumentLevelQueryTags';
import { getIndexFields } from '../MonitorExpressions/expressions/utils/dataTypes';
import { QUERY_OPERATORS } from '../../../Dashboard/components/FindingsDashboard/findingsUtils';

const ALLOWED_DATA_TYPES = ['number', 'text', 'keyword', 'boolean'];

// TODO DRAFT: implement validation
export const ILLEGAL_QUERY_NAME_CHARACTERS = [' '];

class DocumentLevelQuery extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { dataTypes, formFieldName = '', query, queryIndex, queriesArrayHelpers } = this.props;
    return (
      <div style={{ padding: '0px 10px' }}>
        <EuiFlexGroup>
          <EuiFlexItem>
            <FormikFieldText
              name={`${formFieldName}.queryName`}
              formRow
              fieldProps={{
                validate: validateIllegalCharacters(ILLEGAL_QUERY_NAME_CHARACTERS),
              }}
              rowProps={{
                label: 'Query name',
                style: { width: '300px' },
                isInvalid,
                error: hasError,
              }}
              inputProps={{
                placeholder: 'Enter a name for the query',
                isInvalid,
                'data-test-subj': `documentLevelQuery_queryName${queryIndex}`,
              }}
            />
          </EuiFlexItem>

          {queryIndex > 0 && (
            <EuiFlexItem grow={false}>
              <EuiButton
                color={'danger'}
                onClick={() => queriesArrayHelpers.remove(queryIndex)}
                data-test-subj={`documentLevelQuery_removeQueryButton${queryIndex}`}
              >
                Remove query
              </EuiButton>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>

        <EuiSpacer size={'m'} />

        <EuiFlexGroup alignItems={'flexStart'} direction={'row'} gutterSize={'m'}>
          <EuiFlexItem grow={false}>
            <FormikComboBox
              name={`${formFieldName}.field`}
              formRow
              fieldProps={{ validate: required }} // TODO DRAFT: implement validation
              rowProps={{
                label: 'Field',
                style: { width: '300px' },
                isInvalid,
                error: hasError,
              }}
              inputProps={{
                placeholder: 'Enter the field to query',
                options: getIndexFields(dataTypes, ALLOWED_DATA_TYPES),
                onChange: (e, field, form) => form.setFieldValue(field.name, e[0].label),
                onBlur: (e, field, form) => form.setFieldTouched(field.name, true),
                singleSelection: { asPlainText: true },
                isClearable: false,
                'data-test-subj': `documentLevelQuery_field${queryIndex}`,
              }}
            />
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <FormikSelect
              name={`${formFieldName}.operator`}
              formRow={true}
              rowProps={{ hasEmptyLabelSpace: true }}
              inputProps={{
                onChange: (e, field) => field.onChange(e),
                options: QUERY_OPERATORS,
                'data-test-subj': `documentLevelQuery_operator${queryIndex}`,
              }}
            />
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            <FormikFieldText
              name={`${formFieldName}.query`}
              formRow
              fieldProps={{ validate: required }} // TODO DRAFT: What constraints should we implement?
              rowProps={{
                hasEmptyLabelSpace: true,
                style: { width: '300px' },
                isInvalid,
                error: hasError,
              }}
              inputProps={{
                placeholder: 'Enter the search term',
                fullWidth: true,
                isInvalid,
                'data-test-subj': `documentLevelQuery_query${queryIndex}`,
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size={'m'} />

        <ConfigureDocumentLevelQueryTags
          formFieldName={formFieldName}
          query={query}
          queryIndex={queryIndex}
        />

        <EuiHorizontalRule margin={'l'} />
      </div>
    );
  }
}

export default connect(DocumentLevelQuery);
