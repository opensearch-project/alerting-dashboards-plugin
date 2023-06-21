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
import { FormikCodeEditor } from '../../../../components/FormControls';

const ExpressionQuery = ({
  selections,
  dataTestSubj,
  value,
  defaultText,
  label,
  formikName = 'expressionQueries',
  triggerValues,
  isDarkMode = false,
}) => {
  const DEFAULT_DESCRIPTION = defaultText ? defaultText : 'Select';
  const [usedExpressions, setUsedExpressions] = useState([]);
  const [graphUi, setGraphUi] = useState(triggerValues.searchType === 'graph');
  const [editorValue, setEditorValue] = useState('');

  const getQueryTemplate = (monitor_id) => `monitor[id=${monitor_id}]`;
  const queryConditionOperator = '&&';

  useEffect(() => {
    if (value?.length) {
      setUsedExpressions(value);
      _.set(triggerValues, formikName, getValue(value));
    }

    setGraphUi(triggerValues.searchType === 'graph');

    if (selections?.length) {
      const editorValues = [];
      selections.map((selection) => {
        editorValues.push(getQueryTemplate(selection.monitor_id));
      });
      const script = editorValues.join(` ${queryConditionOperator} `);
      setEditorValue(script);
      _.set(triggerValues, 'triggerDefinitions[0].script.source', script);
    }
  }, [value, triggerValues.searchType]);

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

  const isValid = () => selections.length > 1 && usedExpressions.length > 1;

  const validate = () => {
    if (selections.length < 2)
      return 'Trigger condition requires at least two associated monitors.';
    if (usedExpressions.length < 2)
      return 'Trigger condition requires at least two monitors selected.';
  };

  return (
    <FormikInputWrapper
      name={'expressionQueries'}
      fieldProps={{
        validate: () => graphUi && validate(),
      }}
      render={({ field, form }) => (
        <FormikFormRow
          name={'expressionQueries'}
          form={form}
          rowProps={{
            label: label,
            isInvalid: () => form.touched['expressionQueries'] && graphUi && !isValid(),
            error: () => graphUi && validate(),
            style: {
              maxWidth: 'inherit',
            },
          }}
        >
          {graphUi ? (
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
          ) : (
            <FormikCodeEditor
              name="expressionQueries"
              formRow
              fieldProps={{}}
              rowProps={{
                label: 'Trigger condition',
                fullWidth: true,
              }}
              inputProps={{
                mode: 'text',
                width: '80%',
                height: '300px',
                theme: isDarkMode ? 'sense-dark' : 'github',
                value: editorValue,
                onChange: (query, field, form) => {
                  _.set(triggerValues, 'triggerDefinitions[0].script.source', query);
                  form.setFieldValue('expressionQueries', query);
                },
                onBlur: (e, field, form) => {
                  console.log('### triggerValues', triggerValues);
                  form.setFieldTouched('expressionQueries', true);
                },
                'data-test-subj': 'expressionQueriesCodeEditor',
              }}
            />
          )}
        </FormikFormRow>
      )}
    />
  );
};

export default ExpressionQuery;
