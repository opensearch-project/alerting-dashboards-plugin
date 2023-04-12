/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { connect } from 'formik';
import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiSpacer } from '@elastic/eui';
import {
  FormikComboBox,
  FormikFieldNumber,
  FormikFieldText,
  FormikSelect,
} from '../../../../components/FormControls';
import {
  hasError,
  isInvalid,
  required,
  requiredNumber,
  validateIllegalCharacters,
} from '../../../../utils/validate';
import ConfigureDocumentLevelQueryTags from './ConfigureDocumentLevelQueryTags';
import { getIndexFields, getTypeForField } from '../MonitorExpressions/expressions/utils/dataTypes';
import { DATA_TYPES } from '../../../../utils/constants';
import { getOperators } from '../MonitorExpressions/expressions/utils/whereHelpers';
import { getDocLevelQueryOperators } from './utils/helpers';

const ALLOWED_DATA_TYPES = ['number', 'text', 'keyword', 'boolean'];

// TODO DRAFT: implement validation
export const ILLEGAL_QUERY_NAME_CHARACTERS = [' '];

class DocumentLevelQuery extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fieldDataType: DATA_TYPES.TEXT,
      indexFieldOptions: [],
      supportedOperators: getDocLevelQueryOperators(),
    };
  }

  componentDidMount() {
    this.initializeFieldDataType();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.dataTypes !== this.props.dataTypes) this.initializeFieldDataType();
  }

  initializeFieldDataType() {
    const { dataTypes, query } = this.props;
    const indexFieldOptions = getIndexFields(dataTypes, ALLOWED_DATA_TYPES);
    const fieldDataType = getTypeForField(query.field, indexFieldOptions);
    this.setState({ fieldDataType, indexFieldOptions });
  }

  render() {
    const { formFieldName = '', query, queryIndex, queriesArrayHelpers } = this.props;
    const { fieldDataType, indexFieldOptions, supportedOperators } = this.state;
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
                options: indexFieldOptions,
                onChange: (e, field, form) => {
                  this.setState({ fieldDataType: e[0].type });
                  form.setFieldValue(field.name, e[0].label);
                },
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
              rowProps={{
                hasEmptyLabelSpace: true,
                style: { width: '200px' },
              }}
              inputProps={{
                onChange: (e, field) => field.onChange(e),
                options: getOperators(fieldDataType, supportedOperators),
                'data-test-subj': `documentLevelQuery_operator${queryIndex}`,
              }}
            />
          </EuiFlexItem>

          <EuiFlexItem grow={false}>
            {fieldDataType === DATA_TYPES.NUMBER ? (
              <FormikFieldNumber
                name={`${formFieldName}.query`}
                formRow
                fieldProps={{ validate: requiredNumber }}
                rowProps={{
                  hasEmptyLabelSpace: true,
                  style: { width: '300px' },
                  isInvalid,
                  error: hasError,
                }}
                inputProps={{
                  placeholder: 'Enter the search value',
                  fullWidth: true,
                  isInvalid,
                  'data-test-subj': `documentLevelQuery_query${queryIndex}`,
                }}
              />
            ) : (
              <FormikFieldText
                name={`${formFieldName}.query`}
                formRow
                fieldProps={{ validate: required }}
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
            )}
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
