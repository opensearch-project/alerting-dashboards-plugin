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
  edit,
  triggerIndex,
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
      name={`${formikFullFieldName}_${triggerIndex}_fieldContainer`}
      fieldProps={{
        validate: () => graphUi && validate(),
      }}
      render={({ form }) => (
        <FormikFormRow
          name={`triggerConditionFieldsContainer_${triggerIndex}`}
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
          <EuiFlexGroup gutterSize="s" data-test-subj={`${formikFullFieldName}${triggerIndex}`}>
            <EuiFlexItem grow={true}>
              {graphUi ? (
                <ExpressionBuilder
                  triggerIndex={triggerIndex}
                  edit={edit}
                  httpClient={httpClient}
                  values={values}
                  touched={touched}
                  formikFieldName={formikFieldName}
                  formikFieldPath={formikFieldPath}
                />
              ) : (
                <ExpressionEditor
                  triggerIndex={triggerIndex}
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
