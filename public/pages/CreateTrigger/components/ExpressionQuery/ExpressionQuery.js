import React, { useEffect, useState } from 'react';
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiPopover,
  EuiComboBox,
  EuiButtonIcon,
  EuiExpression,
} from '@elastic/eui';
import * as _ from 'lodash';
import { FormikFormRow, FormikInputWrapper } from '../../../../components/FormControls';

const ExpressionQuery = ({
  selections,
  dataTestSubj,
  value,
  defaultText,
  label,
  formikName = 'expressionQueries',
}) => {
  const DEFAULT_DESCRIPTION = defaultText ? defaultText : 'Select';
  const OPERATORS = ['AND', 'OR', 'NOT'];
  const [usedExpressions, setUsedExpressions] = useState([]);

  useEffect(() => {
    let expressions = [];
    if (value?.length) {
      let values = [...value];
      if (OPERATORS.indexOf(values[0]?.description) === -1) values = ['', ...values];

      let counter = 0;
      values.map((exp, idx) => {
        if (idx % 2 === 0) {
          expressions.push({
            description: exp.description,
            isOpen: false,
            monitor_name: '',
            monitor_id: '',
          });
          counter++;
        } else {
          const currentIndex = idx - counter;
          expressions[currentIndex] = { ...expressions[currentIndex], ...exp };
        }
      });
    } else {
      expressions = [];
    }

    setUsedExpressions(expressions);
  }, []);

  const getValue = (expressions) =>
    expressions.map((exp) => ({
      condition: _.toLower(exp.description),
      monitor_id: exp.monitor_id,
      monitor_name: exp.name,
    }));

  const changeMonitor = (selection, exp, idx, form) => {
    const expressions = _.cloneDeep(usedExpressions);
    expressions[idx] = {
      ...expressions[idx],
      monitor_id: selection[0].monitor_id,
      monitor_name: selection[0].label,
    };

    setUsedExpressions(expressions);
    onBlur(form, expressions);
  };

  const changeCondition = (selection, exp, idx, form) => {
    const expressions = _.cloneDeep(usedExpressions);
    expressions[idx] = { ...expressions[idx], description: selection[0].description };
    setUsedExpressions(expressions);
    onBlur(form, expressions);
  };

  const onBlur = (form, expressions) => {
    form.setFieldTouched('expressionQueries', true);
    form.setFieldValue(formikName, getValue(expressions));
    form.setFieldError('expressionQueries', validate());
  };

  const openPopover = (idx) => {
    const expressions = _.cloneDeep(usedExpressions);
    expressions[idx] = { ...expressions[idx], isOpen: !expressions[idx].isOpen };
    setUsedExpressions(expressions);
  };

  const closePopover = (idx) => {
    const expressions = _.cloneDeep(usedExpressions);
    expressions[idx] = { ...expressions[idx], isOpen: false };
    setUsedExpressions(expressions);
  };

  const renderOptions = (expression, idx, form) => (
    <EuiFlexGroup gutterSize="s" data-test-subj={dataTestSubj}>
      <EuiFlexItem grow={false}>
        <EuiComboBox
          style={{ width: '150px' }}
          singleSelection={{ asPlainText: true }}
          compressed
          selectedOptions={[
            {
              label: expression.description,
              description: expression.description,
            },
          ]}
          onChange={(selection) => changeCondition(selection, expression, idx, form)}
          options={[
            { description: '', label: '' },
            { description: 'AND', label: 'AND' },
            { description: 'OR', label: 'OR' },
            { description: 'NOT', label: 'NOT' },
          ]}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{renderMonitorOptions(expression, idx, form)}</EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          data-test-subj={`selection-exp-field-item-remove-${idx}`}
          onClick={() => {
            const usedExp = _.cloneDeep(usedExpressions);
            usedExp.splice(idx, 1);
            usedExp.length && (usedExp[0].description = '');
            setUsedExpressions([...usedExp]);
          }}
          iconType={'trash'}
          color="danger"
          aria-label={'Remove condition'}
          style={{ marginTop: '4px' }}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );

  const renderMonitorOptions = (expression, idx, form) => (
    <EuiComboBox
      singleSelection={{ asPlainText: true }}
      compressed
      onChange={(selection) => changeMonitor(selection, expression, idx, form)}
      selectedOptions={[
        {
          label: expression.monitor_name,
          monitor_id: expression.monitor_id,
        },
      ]}
      style={{ width: '250px' }}
      options={(() => {
        const differences = _.differenceBy(selections, usedExpressions, 'monitor_id');
        return [
          {
            monitor_id: expression.monitor_id,
            label: expression.monitor_name,
          },
          ...differences.map((sel) => ({
            monitor_id: sel.monitor_id,
            label: sel.label,
          })),
        ];
      })()}
    />
  );

  const isValid = () => usedExpressions.length > 1;

  const validate = () => {
    if (!isValid()) return 'At least two monitors should be selected.';
  };

  return (
    <FormikInputWrapper
      name={'expressionQueries'}
      fieldProps={{
        validate: () => validate(),
      }}
      render={({ field, form }) => (
        <FormikFormRow
          name={'expressionQueries'}
          form={form}
          rowProps={{
            label: label,
            isInvalid: () => form.touched['expressionQueries'] && !isValid(),
            error: () => validate(),
          }}
        >
          <EuiFlexGroup
            gutterSize="s"
            data-test-subj={dataTestSubj}
            className={'expressionQueries'}
          >
            {!usedExpressions.length && (
              <EuiFlexItem grow={false} key={`selections_default`}>
                <EuiPopover
                  id={`selections_default`}
                  button={
                    <EuiExpression
                      isInvalid={form.errors['expressionQueries'] && !isValid()}
                      description={DEFAULT_DESCRIPTION}
                      value={''}
                      isActive={false}
                      uppercase={false}
                      onClick={(e) => onBlur(form, usedExpressions)}
                    />
                  }
                  isOpen={false}
                  panelPaddingSize="s"
                  anchorPosition="rightDown"
                  closePopover={() => onBlur(form, usedExpressions)}
                />
              </EuiFlexItem>
            )}
            {usedExpressions.map((expression, idx) => (
              <EuiFlexItem grow={false} key={`selections_${idx}`}>
                <EuiPopover
                  id={`selections_${idx}`}
                  button={
                    <EuiExpression
                      isInvalid={form.errors['expressionQueries'] && !isValid()}
                      aria-label={'Add condition expression'}
                      description={expression.description}
                      value={expression.monitor_name}
                      isActive={expression.isOpen}
                      onClick={(e) => {
                        e.preventDefault();
                        openPopover(idx);
                      }}
                    />
                  }
                  isOpen={expression.isOpen}
                  closePopover={() => closePopover(idx)}
                  panelPaddingSize="s"
                  anchorPosition="rightDown"
                >
                  {renderOptions(expression, idx, form)}
                </EuiPopover>
              </EuiFlexItem>
            ))}
            {selections.length > usedExpressions.length && (
              <EuiFlexItem grow={false} key={`selections_add`}>
                <EuiButtonIcon
                  onClick={() => {
                    const expressions = _.cloneDeep(usedExpressions);
                    const differences = _.differenceBy(selections, expressions, 'monitor_id');
                    const newExpressions = [
                      ...expressions,
                      {
                        description: usedExpressions.length ? 'AND' : '',
                        isOpen: false,
                        monitor_name: differences[0]?.label,
                        monitor_id: differences[0]?.monitor_id,
                      },
                    ];

                    setUsedExpressions(newExpressions);
                    onBlur(form, newExpressions);
                  }}
                  color={'primary'}
                  iconType="plusInCircleFilled"
                  aria-label={'Add one more condition'}
                  data-test-subj={'condition-add-selection-btn'}
                  style={{ marginTop: '1px' }}
                />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </FormikFormRow>
      )}
    />
  );
};

export default ExpressionQuery;
