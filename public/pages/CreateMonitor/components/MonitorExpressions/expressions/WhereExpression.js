/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'formik';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiButtonEmpty,
  EuiText,
  EuiBadge,
  EuiSpacer,
} from '@elastic/eui';
import _ from 'lodash';
import {
  Expressions,
  POPOVER_STYLE,
  EXPRESSION_STYLE,
  WHERE_BOOLEAN_FILTERS,
} from './utils/constants';
import {
  getOperators,
  displayText,
  validateRange,
  isNullOperator,
  isRangeOperator,
} from './utils/whereHelpers';
import { hasError, isInvalid } from '../../../../../utils/validate';
import {
  FormikComboBox,
  FormikSelect,
  FormikFieldNumber,
  FormikFieldText,
} from '../../../../../components/FormControls';
import { getFilteredIndexFields, getIndexFields } from './utils/dataTypes';
import {
  FILTERS_TOOLTIP_TEXT,
  FORMIK_INITIAL_VALUES,
} from '../../../containers/CreateMonitor/utils/constants';
import { DATA_TYPES } from '../../../../../utils/constants';
import {
  TRIGGER_COMPARISON_OPERATORS,
  TRIGGER_OPERATORS_MAP,
} from '../../../../CreateTrigger/containers/DefineBucketLevelTrigger/DefineBucketLevelTrigger';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../../../../CreateTrigger/containers/CreateTrigger/utils/constants';
import { inputLimitText } from '../../../../../utils/helpers';
import IconToolTip from '../../../../../components/IconToolTip';

const propTypes = {
  formik: PropTypes.object.isRequired,
  dataTypes: PropTypes.object.isRequired,
  onMadeChanges: PropTypes.func.isRequired,
  openedStates: PropTypes.object.isRequired,
  openExpression: PropTypes.func.isRequired,
};

const ALLOWED_TYPES = ['number', 'text', 'keyword', 'boolean'];

const MAX_NUM_WHERE_EXPRESSION = 1;

class WhereExpression extends Component {
  constructor(props) {
    super(props);
  }

  handleFieldChange = (option, field, form) => {
    this.props.onMadeChanges();
    this.resetValues();
    form.setFieldValue(field.name, option);
    // User can remove where condition
    if (option.length === 0) {
      this.resetValues();
      form.setFieldError('where', undefined);
    }
  };

  handleOperatorChange = (e, field, form) => {
    this.props.onMadeChanges();
    field.onChange(e);
    form.setFieldError('where', undefined);
  };

  handleChangeWrapper = (e, field) => {
    this.props.onMadeChanges();
    field.onChange(e);
  };

  handleClosePopOver = async () => {
    const {
      formik: { values },
      closeExpression,
      fieldPath = '',
    } = this.props;
    // Explicitly invoking validation, this component unmount after it closes.
    const fieldName = _.get(values, `${fieldPath}where.fieldName`, '');
    const fieldOperator = _.get(values, `${fieldPath}where.operator`, 'is');
    const fieldValue = _.get(values, `${fieldPath}where.fieldValue`, '');
    if (fieldName > 0) {
      await this.props.formik.validateForm();
    }
    if (
      _.isEmpty(fieldName) ||
      (!isNullOperator(fieldOperator) && _.isEmpty(fieldValue.toString()))
    )
      this.resetValues();
    closeExpression(Expressions.WHERE);
  };

  resetValues = () => {
    const { fieldPath, formik, useTriggerFieldOperators = false } = this.props;
    if (useTriggerFieldOperators) {
      _.set(formik, `values.${fieldPath}where`, FORMIK_INITIAL_TRIGGER_VALUES.where);
      formik.setValues({ ...formik.values });
    } else {
      formik.setValues({
        ...formik.values,
        where: { ...FORMIK_INITIAL_VALUES.where },
      });
    }
  };

  renderBetweenAnd = () => {
    const {
      formik: { values },
      fieldPath = '',
    } = this.props;
    return (
      <EuiFlexGroup alignItems="center">
        <EuiFlexItem>
          <FormikFieldNumber
            name={`${fieldPath}where.fieldRangeStart`}
            fieldProps={{
              validate: (value) => validateRange(value, _.get(values, `${fieldPath}where`)),
            }}
            inputProps={{ onChange: this.handleChangeWrapper, isInvalid }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText textAlign="center">TO</EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <FormikFieldNumber
            name={`${fieldPath}where.fieldRangeEnd`}
            fieldProps={{
              validate: (value) => validateRange(value, _.get(values, `${fieldPath}where`)),
            }}
            inputProps={{ onChange: this.handleChangeWrapper, isInvalid }}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  renderValueField = (fieldType, fieldOperator) => {
    const { fieldPath = '' } = this.props;
    if (fieldType === DATA_TYPES.NUMBER) {
      return isRangeOperator(fieldOperator) ? (
        this.renderBetweenAnd()
      ) : (
        <FormikFieldNumber
          name={`${fieldPath}where.fieldValue`}
          inputProps={{ onChange: this.handleChangeWrapper }}
          formRow
          rowProps={{ isInvalid, error: hasError }}
        />
      );
    } else if (fieldType === DATA_TYPES.BOOLEAN) {
      return (
        <FormikSelect
          name={`${fieldPath}where.fieldValue`}
          inputProps={{
            onChange: this.handleChangeWrapper,
            options: WHERE_BOOLEAN_FILTERS,
            isInvalid,
          }}
        />
      );
    } else {
      return (
        <FormikFieldText
          name={`${fieldPath}where.fieldValue`}
          inputProps={{ onChange: this.handleChangeWrapper, isInvalid }}
        />
      );
    }
  };

  render() {
    const {
      formik: { values },
      openedStates,
      openExpression,
      dataTypes,
      indexFieldFilters,
      useTriggerFieldOperators = false,
      fieldPath = '',
    } = this.props;

    const indexFields =
      indexFieldFilters !== undefined
        ? getFilteredIndexFields(dataTypes, ALLOWED_TYPES, indexFieldFilters)
        : getIndexFields(dataTypes, ALLOWED_TYPES);
    const fieldType = _.get(values, `${fieldPath}where.fieldName[0].type`, 'number');
    let fieldOperator = _.get(values, `${fieldPath}where.operator`, 'is');
    if (useTriggerFieldOperators && !_.includes(_.values(TRIGGER_OPERATORS_MAP), fieldOperator)) {
      fieldOperator = TRIGGER_OPERATORS_MAP.INCLUDE;
      _.set(values, `${fieldPath}where.operator`, fieldOperator);
    }

    const fieldOperators = useTriggerFieldOperators
      ? TRIGGER_COMPARISON_OPERATORS
      : getOperators(fieldType);

    const whereFilterHeader = useTriggerFieldOperators ? 'Keyword filter' : 'Data filter';

    const whereValues = _.get(values, `${fieldPath}where`);
    const whereFieldName = _.get(whereValues, 'fieldName[0].label', undefined);

    const showAddButtonFlag = !openedStates[Expressions.WHERE] && !whereFieldName;

    return (
      <div>
        <EuiText size="xs">
          <strong>{whereFilterHeader}</strong>
          <i> - optional </i>
          <IconToolTip content={FILTERS_TOOLTIP_TEXT} iconType="questionInCircle" />
        </EuiText>
        <EuiSpacer size={'s'} />

        {showAddButtonFlag ? (
          <div>
            <EuiText size={'xs'}>No filters defined.</EuiText>
          </div>
        ) : (
          <EuiPopover
            id={`${whereFilterHeader}-badge-popover`}
            button={
              <div style={{ paddingBottom: '5px' }}>
                <EuiBadge
                  color="hollow"
                  iconSide="right"
                  iconType="cross"
                  iconOnClick={() => this.resetValues()}
                  iconOnClickAriaLabel="Remove filter"
                  onClick={() => {
                    openExpression(Expressions.WHERE);
                  }}
                  onClickAriaLabel="Edit where filter"
                >
                  {displayText(_.get(values, `${fieldPath}where`))}
                </EuiBadge>
              </div>
            }
            isOpen={openedStates.WHERE}
            closePopover={this.handleClosePopOver}
            panelPaddingSize="none"
            ownFocus
            withTitle
            anchorPosition="downLeft"
          >
            <div style={POPOVER_STYLE}>
              <EuiFlexGroup style={{ ...EXPRESSION_STYLE }}>
                <EuiFlexItem grow={false} style={{ width: 200 }}>
                  <FormikComboBox
                    name={`${fieldPath}where.fieldName`}
                    inputProps={{
                      placeholder: 'Select a field',
                      options: indexFields,
                      onChange: this.handleFieldChange,
                      isClearable: false,
                      singleSelection: { asPlainText: true },
                    }}
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <FormikSelect
                    name={`${fieldPath}where.operator`}
                    inputProps={{
                      onChange: this.handleOperatorChange,
                      options: fieldOperators,
                    }}
                  />
                </EuiFlexItem>
                {!isNullOperator(fieldOperator) && (
                  <EuiFlexItem>{this.renderValueField(fieldType, fieldOperator)}</EuiFlexItem>
                )}
              </EuiFlexGroup>
            </div>
          </EuiPopover>
        )}

        {showAddButtonFlag && (
          <EuiButtonEmpty
            size="xs"
            data-test-subj={`${fieldPath}where.addFilterButton`}
            onClick={() => openExpression(Expressions.WHERE)}
            style={{ paddingTop: '5px' }}
          >
            + Add filter
          </EuiButtonEmpty>
        )}

        {inputLimitText(
          showAddButtonFlag ? 0 : 1,
          MAX_NUM_WHERE_EXPRESSION,
          _.lowerCase(whereFilterHeader),
          _.lowerCase(`${whereFilterHeader}s`),
          { paddingLeft: '10px' }
        )}
      </div>
    );
  }
}

WhereExpression.propTypes = propTypes;

export default connect(WhereExpression);
