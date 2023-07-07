/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect, FieldArray } from 'formik';
import { EuiButtonEmpty, EuiText, EuiSpacer } from '@elastic/eui';
import _ from 'lodash';
import { Expressions } from './utils/constants';
import {
  FILTERS_TOOLTIP_TEXT,
  FORMIK_INITIAL_WHERE_EXPRESSION_VALUES,
  FORMIK_INITIAL_VALUES,
} from '../../../containers/CreateMonitor/utils/constants';
import { TRIGGER_OPERATORS_MAP } from '../../../../CreateTrigger/containers/DefineBucketLevelTrigger/DefineBucketLevelTrigger';
import { inputLimitText } from '../../../../../utils/helpers';
import IconToolTip from '../../../../../components/IconToolTip';
import WherePopover from './WherePopover';

const propTypes = {
  formik: PropTypes.object.isRequired,
  dataTypes: PropTypes.object.isRequired,
  onMadeChanges: PropTypes.func.isRequired,
  openedStates: PropTypes.object.isRequired,
  openExpression: PropTypes.func.isRequired,
};

export const MAX_NUM_WHERE_EXPRESSION = {
  DATA_FILTERS: 10,
  KEYWORD_FILTERS: 1,
};

class WhereExpression extends Component {
  constructor(props) {
    super(props);
  }

  renderFiltersBadges(filters, filtersArrayHelpers, whereFilterHeader) {
    const {
      openedStates,
      closeExpression,
      openExpression,
      dataTypes,
      indexFieldFilters,
      useTriggerFieldOperators = false,
      fieldPath = '',
      formik,
      onMadeChanges,
    } = this.props;
    const maxNumWhereExpressions = useTriggerFieldOperators
      ? MAX_NUM_WHERE_EXPRESSION.KEYWORD_FILTERS
      : MAX_NUM_WHERE_EXPRESSION.DATA_FILTERS;
    return (
      <div>
        {filters.length === 0 ? (
          <EuiText size={'xs'}>No filters defined.</EuiText>
        ) : (
          <div style={{ maxWidth: '75%' }}>
            {filters.map((filter, index) => (
              <span key={`${fieldPath}filters.${index}`} style={{ paddingRight: '5px' }}>
                <WherePopover
                  closePopover={() => closeExpression(Expressions.WHERE)}
                  dataTypes={dataTypes}
                  indexFieldFilters={indexFieldFilters}
                  fieldPath={`${fieldPath}filters.${index}.`}
                  filtersArrayHelpers={filtersArrayHelpers}
                  formik={formik}
                  index={index}
                  onMadeChanges={onMadeChanges}
                  openPopover={() => openExpression(Expressions.WHERE)}
                  openedState={openedStates.WHERE}
                  useTriggerFieldOperators={useTriggerFieldOperators}
                  values={filter}
                  whereFilterHeader={whereFilterHeader}
                />
              </span>
            ))}
          </div>
        )}

        <EuiSpacer size={'xs'} />
        {filters.length < maxNumWhereExpressions && (
          <EuiButtonEmpty
            size="xs"
            data-test-subj={`${fieldPath}addFilterButton`}
            onClick={() => {
              openExpression(Expressions.WHERE);
              filtersArrayHelpers.push(
                useTriggerFieldOperators
                  ? {
                      ...FORMIK_INITIAL_WHERE_EXPRESSION_VALUES,
                      operator: TRIGGER_OPERATORS_MAP.INCLUDE,
                    }
                  : { ...FORMIK_INITIAL_WHERE_EXPRESSION_VALUES }
              );
            }}
            style={{ paddingTop: '5px' }}
          >
            + Add filter
          </EuiButtonEmpty>
        )}

        {inputLimitText(
          filters.length,
          maxNumWhereExpressions,
          _.lowerCase(whereFilterHeader),
          _.lowerCase(`${whereFilterHeader}s`),
          { paddingLeft: '10px' }
        )}
      </div>
    );
  }

  render() {
    const {
      formik: { values },
      useTriggerFieldOperators = false,
      fieldPath = '',
    } = this.props;
    const whereFilterHeader = useTriggerFieldOperators ? 'Keyword filter' : 'Data filter';
    const filters = _.get(values, `${fieldPath}filters`, FORMIK_INITIAL_VALUES.filters);
    return (
      <div>
        <EuiText size="xs">
          <strong>{whereFilterHeader}</strong>
          <i> - optional </i>
          <IconToolTip content={FILTERS_TOOLTIP_TEXT} iconType="questionInCircle" />
        </EuiText>
        <EuiSpacer size={'s'} />

        <FieldArray name={`${fieldPath}filters`} validateOnChange={true}>
          {(filtersArrayHelpers) =>
            this.renderFiltersBadges(filters, filtersArrayHelpers, whereFilterHeader)
          }
        </FieldArray>
      </div>
    );
  }
}

WhereExpression.propTypes = propTypes;

export default connect(WhereExpression);
