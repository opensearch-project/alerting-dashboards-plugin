import React, { useEffect, useState, useCallback } from 'react';
import { EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { FormikFormRow, FormikInputWrapper } from '../../../../components/FormControls';
import ExpressionBuilder from './ExpressionBuilder';
import ExpressionEditor from './ExpressionEditor';

export const conditionToExpressions = (query, monitors) => {
  const conditionMap = {
    '&&': 'and',
    '||': 'or',
    '!': 'not',
    '': '',
  };
  const queryToExpressionRegex = new RegExp('( && || \\|\\| )?(monitor\\[id=(.*?)\\])', 'gm');
  const matcher = query.matchAll(queryToExpressionRegex);
  let match;
  let expressions = [];
  while ((match = matcher.next())) {
    const monitorId = match[4]?.trim();
    const monitor = monitors.filter((mon) => mon.monitor_id === monitorId);
    expressions.push({
      description: conditionMap[match[1]?.trim()] || '',
      isOpen: false,
      monitor_name: monitor[0]?.monitor_name,
      monitor_id: monitorId,
    });
  }

  return expressions;
};

const CompositeTriggerCondition = ({
  label,
  formikFieldPath = '',
  formikFieldName = 'triggerCondition',
  values,
  isDarkMode = false,
  httpClient,
}) => {
  const formikFullFieldName = `${formikFieldPath}${formikFieldName}`;
  const [graphUi, setGraphUi] = useState(values.searchType === 'graph');

  useEffect(() => {
    setGraphUi(values.searchType === 'graph');
  }, [values.searchType]);

  const isValid = () => true;
  const validate = () => {};
  return (
    <FormikInputWrapper
      name={`${formikFullFieldName}_fieldContainer`}
      fieldProps={{
        validate: () => graphUi && validate(),
      }}
      render={({ form }) => (
        <FormikFormRow
          name={'triggerConditionFieldsContainer'}
          form={form}
          rowProps={{
            label: label,
            isInvalid: () => form.touched[formikFullFieldName] && !isValid(),
            error: () => validate(),
            style: {
              maxWidth: 'inherit',
            },
          }}
        >
          <EuiFlexGroup gutterSize="s" data-test-subj={`${formikFullFieldName}`}>
            <EuiFlexItem grow={true}>
              {graphUi ? (
                <ExpressionBuilder
                  httpClient={httpClient}
                  values={values}
                  formikFieldName={formikFieldName}
                  formikFieldPath={formikFieldPath}
                />
              ) : (
                <ExpressionEditor
                  isDarkMode={isDarkMode}
                  values={values}
                  formikFieldName={formikFieldName}
                  formikFieldPath={formikFieldPath}
                />
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </FormikFormRow>
      )}
    />
  );
};

export default CompositeTriggerCondition;
