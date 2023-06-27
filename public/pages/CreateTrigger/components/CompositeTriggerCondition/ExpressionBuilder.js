import React, { useEffect, useState, useCallback } from 'react';
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
import { getMonitors } from '../../../CreateMonitor/components/AssociateMonitors/AssociateMonitors';

export const conditionToExpressions = (condition, monitors) => {
  if (!condition.length) return [];

  const conditionMap = {
    '&&': 'AND',
    '||': 'OR',
    '!': 'NOT',
    '': '',
  };
  const queryToExpressionRegex = new RegExp(/( && || \|\| )?(monitor\[id=(.*?)\])/, 'gm');
  const matcher = condition.matchAll(queryToExpressionRegex);
  let match;
  let expressions = [];
  let counter = 0;
  while ((match = matcher.next().value)) {
    if (counter && !match[1]) return; // Didn't find condition after the first match

    const monitorId = match[3]?.trim(); // match [3] is the monitor_id
    const monitor = monitors.filter((mon) => mon.monitor_id === monitorId);
    expressions.push({
      description: conditionMap[match[1]?.trim()] || '', // match [1] is the description/condition
      isOpen: false,
      monitor_name: monitor[0]?.monitor_name,
      monitor_id: monitorId,
    });

    counter++;
  }

  return expressions;
};

const ExpressionBuilder = ({
  formikFieldPath = '',
  formikFieldName,
  values,
  touched,
  httpClient,
}) => {
  const formikFullFieldName = `${formikFieldPath}${formikFieldName}`;
  const formikFullFieldValue = _.replace(`${formikFullFieldName}_value`, /[.\[\]]/gm, '_');

  const DEFAULT_CONDITION = 'AND';
  const DEFAULT_NAME = 'Select associated monitor';
  const DEFAULT_EXPRESSION = {
    description: '',
    isOpen: false,
    monitor_id: '',
    monitor_name: DEFAULT_NAME,
  };
  const DEFAULT_NEXT_EXPRESSION = {
    ...DEFAULT_EXPRESSION,
    description: DEFAULT_CONDITION,
  };
  const EXPRESSION_CONDITIONS_MAP = [
    { description: '', label: '' },
    { description: 'AND', label: 'AND' },
    { description: 'OR', label: 'OR' },
    { description: 'NOT', label: 'NOT' },
  ];

  const [usedExpressions, setUsedExpressions] = useState([DEFAULT_EXPRESSION]);
  const [options, setOptions] = useState([]);

  useEffect(() => {
    // initializing formik because these are generic fields and formik won't pick them up until fields is updated
    _.set(touched, formikFullFieldValue, false);
    _.set(values, formikFullFieldValue, '');

    const monitors = _.get(values, 'monitorOptions', []);
    if (monitors.length) {
      setInitialValues(monitors);
    } else {
      getMonitors(httpClient).then((monitors) => {
        _.set(values, 'monitorOptions', monitors);
        setInitialValues(monitors);
      });
    }
  }, [values.associatedMonitors?.sequence?.delegates, values[formikFullFieldName]]);

  const setInitialValues = (monitors) => {
    const monitorOptions = [];
    const associatedMonitors = _.get(values, 'associatedMonitors', {});
    associatedMonitors.sequence.delegates.forEach((monitor, index) => {
      const filteredOption = monitors.filter((option) => option.monitor_id === monitor.monitor_id);
      monitorOptions.push({
        label: filteredOption[0]?.monitor_name || '',
        monitor_id: monitor.monitor_id,
      });
    });
    setOptions(monitorOptions);

    const condition = _.get(values, formikFullFieldName, '');
    const expressions = conditionToExpressions(condition, monitors);
    setUsedExpressions(expressions?.length ? expressions : [DEFAULT_EXPRESSION]);
  };

  const expressionsToCondition = (expressions) => {
    const conditionMap = {
      AND: '&&',
      OR: '||',
      NOT: '!',
      '': '',
    };

    const condition = expressions.reduce((query, expression) => {
      if (expression?.monitor_id) {
        query += ` ${conditionMap[expression.description]} monitor[id=${expression.monitor_id}]`;
        query = query.trim();
      }
      return query;
    }, '');

    return `(${condition})`;
  };

  const changeMonitor = (selection, exp, idx, form) => {
    const expressions = _.cloneDeep(usedExpressions);
    let monitor = selection[0];

    if (monitor?.monitor_id) {
      expressions[idx] = {
        ...expressions[idx],
        monitor_id: monitor.monitor_id,
        monitor_name: monitor.label,
      };
    } else {
      expressions[idx] = idx ? DEFAULT_NEXT_EXPRESSION : DEFAULT_EXPRESSION;
    }

    setUsedExpressions(expressions);
    onChange(form, expressions);
  };

  const changeCondition = (selection, exp, idx, form) => {
    const expressions = _.cloneDeep(usedExpressions);

    expressions[idx] = { ...expressions[idx], description: selection[0].description };
    setUsedExpressions(expressions);
    onChange(form, expressions);
  };

  const onChange = (form, expressions) => {
    form.setFieldValue(formikFullFieldName, expressionsToCondition(expressions));
  };

  const onBlur = (form, expressions) => {
    onChange(form, expressions);
    form.setFieldTouched(formikFullFieldValue, true);
  };

  const openPopover = (idx = 0) => {
    const expressions = _.cloneDeep(usedExpressions);
    expressions[idx] = { ...expressions[idx], isOpen: !expressions[idx].isOpen };
    setUsedExpressions(expressions);
  };

  const closePopover = (idx, form) => {
    const expressions = _.cloneDeep(usedExpressions);
    expressions[idx] = { ...expressions[idx], isOpen: false };
    setUsedExpressions(expressions);
    onBlur(form, expressions);
    form.setFieldTouched(`expressionQueries_${idx}`, true);
  };

  const onRemoveExpression = useCallback(
    (form, idx) => {
      const expressions = _.cloneDeep(usedExpressions);
      expressions.splice(idx, 1);
      expressions.length && (expressions[0].description = '');

      if (!expressions?.length) {
        expressions.push(DEFAULT_EXPRESSION);
      }
      setUsedExpressions([...expressions]);
      onChange(form, expressions);
    },
    [usedExpressions]
  );

  const hasInvalidExpression = () =>
    !!usedExpressions.filter((expression) => expression.monitor_id === '')?.length;

  const isValid = () => options.length > 1 && usedExpressions.length > 1 && !hasInvalidExpression();

  const validate = () => {
    if (options.length < 2) return 'Trigger condition requires at least two associated monitors.';
    if (usedExpressions.length < 2)
      return 'Trigger condition requires at least two monitors selected.';
    if (hasInvalidExpression()) return 'Invalid expressions.';
  };

  const renderOptions = (expression, idx = 0, form) => (
    <EuiFlexGroup gutterSize="s" data-test-subj={`${formikFullFieldName}_options`}>
      <EuiFlexItem grow={false}>
        <EuiComboBox
          style={{ width: '150px' }}
          singleSelection={{ asPlainText: true }}
          data-test-subj={`condition-combobox-${idx}`}
          compressed
          selectedOptions={[
            {
              label: expression.description,
              description: expression.description,
            },
          ]}
          onChange={(selection) => changeCondition(selection, expression, idx, form)}
          onBlur={() => onBlur(form, usedExpressions)}
          options={EXPRESSION_CONDITIONS_MAP}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{renderMonitorOptions(expression, idx, form)}</EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          data-test-subj={`selection-exp-field-item-remove-${idx}`}
          onClick={() => onRemoveExpression(form, idx)}
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
      onBlur={() => onBlur(form, usedExpressions)}
      selectedOptions={[
        {
          label: expression.monitor_name,
          monitor_id: expression.monitor_id,
        },
      ]}
      style={{ width: '250px' }}
      data-test-subj={`monitors-combobox-${idx}`}
      options={(() => {
        const differences = _.differenceBy(options, usedExpressions, 'monitor_id');
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

  return (
    <FormikInputWrapper
      name={formikFullFieldValue}
      fieldProps={{
        validate: () => validate(),
      }}
      render={({ form }) => (
        <FormikFormRow
          name={formikFullFieldValue}
          form={form}
          rowProps={{
            isInvalid: () => form.touched[formikFullFieldValue] && !isValid(),
            error: () => validate(),
            style: {
              maxWidth: 'inherit',
            },
          }}
        >
          <EuiFlexGroup
            gutterSize="s"
            data-test-subj={formikFullFieldName}
            className={'expressionQueries'}
          >
            {usedExpressions.map((expression, idx) => (
              <EuiFlexItem grow={false} key={`selection_${idx}`}>
                <EuiPopover
                  id={`selection_${idx}`}
                  button={
                    <EuiExpression
                      isInvalid={form.touched[`expressionQueries_${idx}`] && !expression.monitor_id}
                      aria-label={'Add condition expression'}
                      description={expression.description}
                      value={expression.monitor_name}
                      isActive={!!options?.length}
                      onClick={() => {
                        form.setFieldTouched(formikFullFieldValue, true);
                        openPopover(idx);
                      }}
                      data-test-subj={`select-expression_${idx}`}
                    />
                  }
                  isOpen={expression.isOpen}
                  closePopover={() => closePopover(idx, form)}
                  panelPaddingSize="s"
                  anchorPosition="upCenter"
                >
                  {renderOptions(expression, idx, form)}
                </EuiPopover>
              </EuiFlexItem>
            ))}
            {options.length > usedExpressions.length && (
              <EuiFlexItem grow={false} key={`selection_add`}>
                <EuiButtonIcon
                  onClick={() => {
                    const expressions = _.cloneDeep(usedExpressions);
                    expressions.push({
                      ...DEFAULT_NEXT_EXPRESSION,
                    });
                    setUsedExpressions(expressions);
                  }}
                  color={'primary'}
                  iconType="plusInCircleFilled"
                  aria-label={'Add one more condition'}
                  data-test-subj={'condition-add-options-btn'}
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

export default ExpressionBuilder;
