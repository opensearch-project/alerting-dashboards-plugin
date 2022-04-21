/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import _ from 'lodash';
import { EuiButton, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { FormikComboBox, FormikSelect } from '../../../../components/FormControls';
import { AND_OR_CONDITION_OPTIONS } from '../../utils/constants';

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
    return isFirstCondition ? (
      <FormikComboBox
        name={`${formFieldName}.query`}
        formRow={true}
        rowProps={{
          label: isFirstCondition ? 'Specify queries or tags' : undefined,
          hasEmptyLabelSpace: !isFirstCondition,
        }}
        inputProps={{
          placeholder: 'Select a query or tag',
          onChange: (e, field, form) => form.setFieldValue(field.name, e[0].value),
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
        }}
      />
    ) : (
      <EuiFlexGroup alignItems={'flexEnd'}>
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
            }}
          />
        </EuiFlexItem>

        <EuiFlexItem grow={false} style={{ width: '300px' }}>
          <FormikComboBox
            name={`${formFieldName}.query`}
            formRow={true}
            rowProps={{
              hasEmptyLabelSpace: true,
            }}
            inputProps={{
              placeholder: 'Select another query or tag',
              onChange: (e, field, form) => form.setFieldValue(field.name, e[0].value),
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
            }}
          />
        </EuiFlexItem>

        <EuiFlexItem grow={false}>
          <EuiButton color={'danger'} onClick={() => arrayHelpers.remove(index)}>
            Remove condition
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
}

export default DocumentLevelTriggerExpression;
