import React, { useEffect, useState } from 'react';
import { EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { FormikFormRow, FormikInputWrapper } from '../../../../components/FormControls';
import ExpressionBuilder from './ExpressionBuilder';
import ExpressionEditor from './ExpressionEditor';

const CompositeTriggerCondition = ({
  label,
  formikFieldPath = '',
  formikFieldName = 'triggerCondition',
  values,
  touched,
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
                  touched={touched}
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
