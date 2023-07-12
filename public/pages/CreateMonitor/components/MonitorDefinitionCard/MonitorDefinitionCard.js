/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiText } from '@elastic/eui';
import FormikCheckableCard from '../../../../components/FormControls/FormikCheckableCard/FormikCheckableCard';
import { OS_AD_PLUGIN, MONITOR_TYPE, SEARCH_TYPE } from '../../../../utils/constants';
import { URL } from '../../../../../utils/constants';
import _ from 'lodash';
import { conditionToExpressions } from '../../../CreateTrigger/components/CompositeTriggerCondition/ExpressionBuilder';

const MONITOR_DEFINITION_CARD_WIDTH = '275';

const onChangeDefinition = (e, form, values) => {
  const type = e.target.value;
  form.setFieldValue('searchType', type, false);

  let preventVisualEditor = false;

  if (values.monitor_type === MONITOR_TYPE.COMPOSITE_LEVEL && type === 'graph') {
    const triggerDefinitions = _.get(values, 'triggerDefinitions', []);
    const monitors = _.get(values, 'monitorOptions', []);
    for (let trigger of triggerDefinitions) {
      const triggerConditions = trigger.triggerConditions || '';
      const parsedConditions = conditionToExpressions(triggerConditions, monitors);

      if (triggerConditions !== '()' && !!triggerConditions.length && !parsedConditions.length) {
        preventVisualEditor = true;
        break;
      }
    }
  }

  form.setFieldValue('preventVisualEditor', preventVisualEditor);
};

const MonitorDefinitionCard = ({ values, plugins }) => {
  const hasADPlugin = plugins.indexOf(OS_AD_PLUGIN) !== -1;
  let supportsADOption;
  switch (values.monitor_type) {
    case MONITOR_TYPE.QUERY_LEVEL:
      supportsADOption = true;
      break;
    default:
      supportsADOption = false;
  }
  return (
    <div>
      <EuiText size={'xs'} style={{ paddingBottom: '0px', marginBottom: '0px' }}>
        <h4>Monitor defining method</h4>
      </EuiText>
      <EuiText color={'subdued'} size={'xs'}>
        Specify the way you want to define your query and triggers.{' '}
        <EuiLink external href={URL.CREATE_MONITOR_DOCUMENTATION} target="_blank">
          Learn more
        </EuiLink>
      </EuiText>
      <EuiFlexGroup
        alignItems={'flexStart'}
        gutterSize={'s'}
        style={{ paddingTop: '0px', marginTop: '0px' }}
      >
        <EuiFlexItem grow={false} style={{ width: `${MONITOR_DEFINITION_CARD_WIDTH}px` }}>
          <FormikCheckableCard
            name="searchTypeGraph"
            formRow
            inputProps={{
              id: 'visualEditorRadioCard',
              label: 'Visual editor',
              checked: values.searchType === SEARCH_TYPE.GRAPH,
              value: SEARCH_TYPE.GRAPH,
              onChange: (e, field, form) => {
                onChangeDefinition(e, form, values);
              },
              'data-test-subj': 'visualEditorRadioCard',
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ width: `${MONITOR_DEFINITION_CARD_WIDTH}px` }}>
          <FormikCheckableCard
            name="searchTypeQuery"
            formRow
            inputProps={{
              id: 'extractionQueryEditorRadioCard',
              label: 'Extraction query editor',
              checked: values.searchType === SEARCH_TYPE.QUERY,
              value: SEARCH_TYPE.QUERY,
              onChange: (e, field, form) => {
                onChangeDefinition(e, form, values);
              },
              'data-test-subj': 'extractionQueryEditorRadioCard',
            }}
          />
        </EuiFlexItem>
        {/*// Only show the anomaly detector option when anomaly detection plugin is present, and for supporting monitors.*/}
        {hasADPlugin && supportsADOption && (
          <EuiFlexItem grow={false} style={{ width: `${MONITOR_DEFINITION_CARD_WIDTH}px` }}>
            <FormikCheckableCard
              name="searchTypeAD"
              inputProps={{
                id: 'anomalyDetectorRadioCard',
                label: 'Anomaly detector',
                checked: values.searchType === SEARCH_TYPE.AD,
                value: SEARCH_TYPE.AD,
                onChange: (e, field, form) => {
                  onChangeDefinition(e, form, values);
                },
                'data-test-subj': 'anomalyDetectorRadioCard',
              }}
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </div>
  );
};

export default MonitorDefinitionCard;
