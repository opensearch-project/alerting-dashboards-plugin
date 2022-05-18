/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import { EuiButton, EuiFlexGroup, EuiFlexItem, EuiFormRow } from '@elastic/eui';
import { FormikComboBox, FormikSelect } from '../../../../components/FormControls';
import { AND_OR_CONDITION_OPTIONS } from '../../utils/constants';
import { hasError, isInvalid, required } from '../../../../utils/validate';

class DocumentLevelTriggerExpression extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      arrayHelpers,
      formFieldName,
      index,
      querySelectOptions = [],
      tagSelectOptions = [],
      values,
    } = this.props;
    const isFirstCondition = index === 0;
    if (index > 0)
      values['andOrCondition'] = values.andOrCondition || AND_OR_CONDITION_OPTIONS[0].value;
    return (
      <EuiFlexGroup alignItems={'flexStart'} gutterSize={'m'}>
        {/* Do not display AND/OR selector for the first condition */}
        {!isFirstCondition && (
          <EuiFlexItem grow={false} style={{ width: '100px' }}>
            <FormikSelect
              name={`${formFieldName}.andOrCondition`}
              formRow={true}
              rowProps={{
                hasEmptyLabelSpace: true,
              }}
              inputProps={{
                onChange: (e, field) => field.onChange(e),
                options: AND_OR_CONDITION_OPTIONS,
                'data-test-subj': `documentLevelTriggerExpression_andOr_${formFieldName}`,
              }}
            />
          </EuiFlexItem>
        )}

        <EuiFlexItem grow={false} style={{ width: '300px' }}>
          <FormikComboBox
            name={`${formFieldName}.query`}
            formRow={true}
            fieldProps={{ validate: required }}
            rowProps={{
              label: isFirstCondition ? 'Specify queries or tags' : undefined,
              hasEmptyLabelSpace: !isFirstCondition,
              isInvalid,
              error: hasError,
            }}
            inputProps={{
              placeholder: 'Select another query or tag',
              onChange: (e, field, form) => form.setFieldValue(field.name, e[0].value),
              onBlur: (e, field, form) => form.setFieldTouched(field.name, true),
              isClearable: false,
              singleSelection: { asPlainText: true },
              options: [
                { label: 'Queries', options: querySelectOptions },
                { label: 'Tags', options: tagSelectOptions },
              ],
              selectedOptions:
                !_.isEmpty(values.query) && !_.isEmpty(values.query.queryName)
                  ? [
                      {
                        value: values.query.queryName,
                        label: values.query.queryName,
                        query: values.query,
                      },
                    ]
                  : undefined,
              'data-test-subj': `documentLevelTriggerExpression_query_${formFieldName}`,
            }}
          />
        </EuiFlexItem>

        {/* Do not display this button for the first condition */}
        {!isFirstCondition && (
          <EuiFlexItem grow={false}>
            <EuiFormRow hasEmptyLabelSpace={true}>
              <EuiButton
                color={'danger'}
                onClick={() => arrayHelpers.remove(index)}
                data-test-subj={`documentLevelTriggerExpression_removeConditionButton_${formFieldName}`}
              >
                Remove condition
              </EuiButton>
            </EuiFormRow>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    );
  }
}

export default DocumentLevelTriggerExpression;
