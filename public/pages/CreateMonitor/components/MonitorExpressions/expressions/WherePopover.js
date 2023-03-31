/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiPopoverTitle,
  EuiText,
  EuiBadge,
} from '@elastic/eui';
import _ from 'lodash';
import { POPOVER_STYLE, EXPRESSION_STYLE, WHERE_BOOLEAN_FILTERS } from './utils/constants';
import {
  getOperators,
  displayText,
  validateRange,
  isNullOperator,
  isRangeOperator,
  validateWhereFilter,
} from './utils/whereHelpers';
import { hasError, isInvalid } from '../../../../../utils/validate';
import {
  FormikComboBox,
  FormikSelect,
  FormikFieldNumber,
  FormikFieldText,
} from '../../../../../components/FormControls';
import { getFilteredIndexFields, getIndexFields } from './utils/dataTypes';
import { TRIGGER_COMPARISON_OPERATORS } from '../../../../CreateTrigger/containers/DefineBucketLevelTrigger/DefineBucketLevelTrigger';
import { DATA_TYPES } from '../../../../../utils/constants';

export const ALLOWED_TYPES = ['number', 'text', 'keyword', 'boolean'];

export default class WherePopover extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    };
  }

  componentDidMount() {
    this.setState({ isOpen: this.props.openedState });
  }

  handleFieldChange = (option, field, form) => {
    this.props.onMadeChanges();
    form.setFieldValue(field.name, option);
    // User can remove where condition
    if (option.length === 0) {
      this.resetValues();
      form.setFieldError(this.props.fieldPath, undefined);
    }
  };

  handleOperatorChange = (e, field, form) => {
    this.props.onMadeChanges();
    field.onChange(e);
    form.setFieldError(this.props.fieldPath, undefined);
  };

  handleChangeWrapper = (e, field) => {
    this.props.onMadeChanges();
    field.onChange(e);
  };

  renderBetweenAnd = () => {
    const { fieldPath = '', values } = this.props;
    return (
      <EuiFlexGroup alignItems="center">
        <EuiFlexItem>
          <FormikFieldNumber
            name={`${fieldPath}fieldRangeStart`}
            fieldProps={{
              validate: (value) => validateRange(value, values),
            }}
            inputProps={{
              placeholder: 'Enter a value',
              onChange: this.handleChangeWrapper,
              isInvalid,
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText textAlign="center">TO</EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <FormikFieldNumber
            name={`${fieldPath}fieldRangeEnd`}
            fieldProps={{
              validate: (value) => validateRange(value, values),
            }}
            inputProps={{
              placeholder: 'Enter a value',
              onChange: this.handleChangeWrapper,
              isInvalid,
            }}
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
          name={`${fieldPath}fieldValue`}
          inputProps={{
            placeholder: 'Enter a value',
            onChange: this.handleChangeWrapper,
          }}
          formRow
          rowProps={{ isInvalid, error: hasError }}
        />
      );
    } else if (fieldType === DATA_TYPES.BOOLEAN) {
      return (
        <FormikSelect
          name={`${fieldPath}fieldValue`}
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
          name={`${fieldPath}fieldValue`}
          inputProps={{
            placeholder: 'Enter a value',
            onChange: this.handleChangeWrapper,
            isInvalid,
          }}
        />
      );
    }
  };

  resetValues = () => {
    const { index, filtersArrayHelpers } = this.props;
    filtersArrayHelpers.remove(index);
  };

  openPopover = () => {
    this.props.openPopover();
    this.setState({ isOpen: true });
  };

  closePopover = () => {
    const { closePopover, formik, values } = this.props;
    closePopover();
    this.setState({ isOpen: false });

    if (validateWhereFilter(values)) formik.validateForm();
    else this.resetValues();
  };

  onCancel = () => {
    this.closePopover();
    this.resetValues();
  };

  render() {
    const {
      dataTypes,
      fieldPath,
      indexFieldFilters,
      useTriggerFieldOperators = false,
      values,
      whereFilterHeader,
    } = this.props;
    const { isOpen } = this.state;

    const indexFields =
      indexFieldFilters !== undefined
        ? getFilteredIndexFields(dataTypes, ALLOWED_TYPES, indexFieldFilters)
        : getIndexFields(dataTypes, ALLOWED_TYPES);
    const fieldType = _.get(values, `fieldName[0].type`, 'number');
    const fieldOperator = _.get(values, `operator`, 'is');
    const fieldOperators = useTriggerFieldOperators
      ? TRIGGER_COMPARISON_OPERATORS
      : getOperators(fieldType);

    return (
      <EuiPopover
        id={`${whereFilterHeader}-${fieldPath}-badge-popover`}
        button={
          <div style={{ paddingBottom: '5px' }}>
            <EuiBadge
              color={'hollow'}
              iconSide={'right'}
              iconType={'cross'}
              iconOnClick={this.onCancel}
              iconOnClickAriaLabel={'Remove filter'}
              onClick={this.openPopover}
              onClickAriaLabel={'Edit where filter'}
            >
              {displayText(values)}
            </EuiBadge>
          </div>
        }
        isOpen={isOpen}
        closePopover={this.closePopover}
        panelPaddingSize={'none'}
        ownFocus
        anchorPosition={'downLeft'}
      >
        <EuiPopoverTitle> ADD {_.upperCase(whereFilterHeader)} </EuiPopoverTitle>
        <div style={POPOVER_STYLE}>
          <EuiFlexGroup style={{ ...EXPRESSION_STYLE }}>
            <EuiFlexItem grow={false} style={{ width: 200 }}>
              <FormikComboBox
                name={`${fieldPath}fieldName`}
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
                name={`${fieldPath}operator`}
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
    );
  }
}
