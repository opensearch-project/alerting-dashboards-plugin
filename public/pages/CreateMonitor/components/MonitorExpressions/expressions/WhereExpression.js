/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
  MAX_NUM_WHERE_EXPRESSION,
} from './utils/constants';
import {
  getOperators,
  displayText,
  validateRange,
  isNullOperator,
  isRangeOperator,
  getIsDataFilterActive,
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
    const {
      fieldPath,
      formik,
      useTriggerFieldOperators = false,
      flyoutMode,
      closeExpression,
    } = this.props;

    if (useTriggerFieldOperators) {
      _.set(formik, `values.${fieldPath}where`, FORMIK_INITIAL_TRIGGER_VALUES.where);
      formik.setValues({ ...formik.values });
    } else {
      formik.setValues({
        ...formik.values,
        where: { ...FORMIK_INITIAL_VALUES.where },
      });
    }

    if (flyoutMode) {
      closeExpression(Expressions.WHERE);
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
      formik,
      openedStates,
      openExpression,
      dataTypes,
      indexFieldFilters,
      useTriggerFieldOperators = false,
      fieldPath = '',
      flyoutMode,
    } = this.props;
    const { values } = formik;
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
    const showAddButtonFlag = !getIsDataFilterActive({ formik, openedStates, fieldPath });
    const inputs = (
      <EuiFlexGroup style={flyoutMode ? {} : { ...EXPRESSION_STYLE }} alignItems="flexEnd">
        <EuiFlexItem grow={false} style={{ width: 200 }}>
          <EuiFlexGroup direction="column" gutterSize="xs">
            <EuiFlexItem>
              <FormikComboBox
                name={`${fieldPath}where.fieldName`}
                formRow
                rowProps={{
                  label: flyoutMode ? 'Field' : '',
                }}
                inputProps={{
                  placeholder: 'Select a field',
                  options: indexFields,
                  onChange: this.handleFieldChange,
                  isClearable: false,
                  singleSelection: { asPlainText: true },
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup direction="column" gutterSize="xs">
            <EuiFlexItem>
              <FormikSelect
                name={`${fieldPath}where.operator`}
                formRow
                rowProps={{
                  label: flyoutMode ? 'Operator' : '',
                }}
                inputProps={{
                  onChange: this.handleOperatorChange,
                  options: fieldOperators,
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        {!isNullOperator(fieldOperator) && (
          <EuiFlexItem>{this.renderValueField(fieldType, fieldOperator)}</EuiFlexItem>
        )}
      </EuiFlexGroup>
    );
    const badge = (
      <EuiBadge
        color="hollow"
        iconSide="right"
        iconType="cross"
        iconOnClick={() => this.resetValues()}
        iconOnClickAriaLabel="Remove filter"
        onClick={() => openExpression(Expressions.WHERE)}
        onClickAriaLabel="Edit where filter"
      >
        {displayText(_.get(values, `${fieldPath}where`))}
      </EuiBadge>
    );

    return (
      <div>
        {flyoutMode && !showAddButtonFlag && (
          <>
            {badge}
            <EuiSpacer size="s" />
            {inputs}
          </>
        )}
        {!flyoutMode && (
          <>
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
                <div style={POPOVER_STYLE}>{inputs}</div>
              </EuiPopover>
            )}
          </>
        )}
        {showAddButtonFlag && (
          <EuiButtonEmpty
            size="xs"
            data-test-subj={`${fieldPath}where.addFilterButton`}
            onClick={() => openExpression(Expressions.WHERE)}
            style={flyoutMode ? {} : { paddingTop: '5px' }}
          >
            + Add filter
          </EuiButtonEmpty>
        )}
        {!flyoutMode && (
          <>
            {inputLimitText(
              showAddButtonFlag ? 0 : 1,
              MAX_NUM_WHERE_EXPRESSION,
              _.lowerCase(whereFilterHeader),
              _.lowerCase(`${whereFilterHeader}s`),
              { paddingLeft: '10px' }
            )}
          </>
        )}
      </div>
    );
  }
}

WhereExpression.propTypes = propTypes;

export default connect(WhereExpression);
