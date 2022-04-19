/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import { connect } from 'formik';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { FormikFieldText, FormikComboBox, FormikSelect } from '../../../../components/FormControls';
import { hasError, isInvalid, required } from '../../../../utils/validate';
import { FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES } from '../../containers/CreateMonitor/utils/constants';
import { DOC_LEVEL_TAG_TOOLTIP } from './DocumentLevelQueryTag';
import IconToolTip from '../../../../components/IconToolTip';
import ConfigureDocumentLevelQueryTags from './ConfigureDocumentLevelQueryTags';
import { getIndexFields } from '../MonitorExpressions/expressions/utils/dataTypes';

const ALLOWED_DATA_TYPES = ['number', 'text', 'keyword', 'boolean'];

export const QUERY_OPERATORS = [
  { text: 'is', value: '==' },
  { text: 'is not', value: '!=' },
];

export const getInitialQueryValues = (queryIndexNum = 0) =>
  _.cloneDeep({
    ...FORMIK_INITIAL_DOCUMENT_LEVEL_QUERY_VALUES,
    queryName: `Query ${queryIndexNum + 1}`,
  });

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
              fieldProps={{ validate: required }} // TODO DRAFT: implement validation
              rowProps={{
                label: 'Query name',
                style: { width: '300px' },
                isInvalid,
                error: hasError,
              }}
              inputProps={{ isInvalid }}
            />
          </EuiFlexItem>

          {queryIndex > 0 && (
            <EuiFlexItem grow={false}>
              <EuiButton color={'danger'} onClick={() => queriesArrayHelpers.remove(queryIndex)}>
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
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer size={'m'} />

        <EuiText size={'xs'}>
          <strong>Tags</strong>
          <i> - optional </i>
          <IconToolTip content={DOC_LEVEL_TAG_TOOLTIP} iconType={'questionInCircle'} />
        </EuiText>
        <EuiSpacer size={'s'} />

        {_.isEmpty(query.tags) && (
          <div>
            <EuiText size={'xs'}>No tags defined.</EuiText>
          </div>
        )}

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
