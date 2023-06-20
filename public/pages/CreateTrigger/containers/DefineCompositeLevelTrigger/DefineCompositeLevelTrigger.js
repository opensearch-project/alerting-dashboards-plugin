/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { EuiSpacer, EuiText } from '@elastic/eui';
import { FormikFieldText, FormikSelect } from '../../../../components/FormControls';
import { hasError, isInvalid } from '../../../../utils/validate';
import { SEVERITY_OPTIONS } from '../../utils/constants';
import ExpressionQuery from '../../components/ExpressionQuery/ExpressionQuery';
import TriggerNotifications from './TriggerNotifications';
import ContentPanel from '../../../../components/ContentPanel';
import { FORMIK_INITIAL_TRIGGER_VALUES } from '../CreateTrigger/utils/constants';
import { getMonitors } from '../../../CreateMonitor/containers/WorkflowDetails/WorkflowDetails';

const defaultRowProps = {
  label: 'Trigger name',
  style: { paddingLeft: '10px' },
  isInvalid,
  error: hasError,
};

const defaultInputProps = { isInvalid };

const selectFieldProps = {
  validate: () => {},
};

const selectRowProps = {
  label: 'Severity level',
  style: { paddingLeft: '10px', marginTop: '0px' },
  isInvalid,
  error: hasError,
};

const selectInputProps = {
  options: SEVERITY_OPTIONS,
};

const propTypes = {
  monitorValues: PropTypes.object.isRequired,
  triggerValues: PropTypes.object.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

export const titleTemplate = (title, subTitle) => (
  <EuiText>
    <div style={{ fontWeight: 'bold' }}>{title}</div>
    {subTitle && (
      <EuiText color={'subdued'} size={'xs'}>
        {subTitle}
      </EuiText>
    )}
    <EuiSpacer size={'s'} />
  </EuiText>
);

export const convertQueryToExpressions = (query, monitors) => {
  const conditionMap = {
    '&&': 'and',
    '||': 'or',
    '!': 'not',
    '': '',
  };
  const queryToExpressionRegex = new RegExp('(&& )?(\\|\\| )?(monitor\\[id=(.*?)\\])', 'g');
  const matcher = query.matchAll(queryToExpressionRegex);
  let match;
  let expressions = [];
  while ((match = matcher.next().value)) {
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

class DefineCompositeLevelTrigger extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expressions: [],
    };
  }

  componentDidMount() {
    getMonitors(this.props.httpClient).then((monitors) => {
      const inputIds = this.props.monitorValues.inputs?.map((input) => input.monitor_id);
      if (inputIds && inputIds.length) {
        const selectedMonitors = monitors.filter(
          (monitor) => inputIds.indexOf(monitor.monitor_id) !== -1
        );

        const expressions = convertQueryToExpressions(
          this.props.triggerValues.triggerDefinitions[0].script.source,
          selectedMonitors
        );

        this.setState({
          expressions,
        });
      }
    });
  }

  render() {
    const {
      edit,
      monitorValues,
      triggerValues,
      httpClient,
      notifications,
      notificationService,
      plugins,
    } = this.props;

    const fieldPath = `triggerDefinitions[0].`;
    const triggerName = _.get(triggerValues, `${fieldPath}name`, 'Trigger');
    const triggerDefinitions = _.get(triggerValues, 'triggerDefinitions', []);
    _.set(triggerValues, 'triggerDefinitions', [
      {
        ...FORMIK_INITIAL_TRIGGER_VALUES,
        ...triggerDefinitions[0],
        severity: 1,
        name: triggerName,
      },
    ]);
    const triggerActions = _.get(triggerValues, 'triggerDefinitions[0].actions', []);
    const monitorList = monitorValues?.associatedMonitors
      ? monitorValues.associatedMonitors?.map((monitor) => ({
          label: monitor.label.replaceAll(' ', '_'),
          monitor_id: monitor.value,
        }))
      : [];

    return (
      <ContentPanel
        title={'Alert trigger'}
        titleSize="s"
        panelStyles={{
          paddingBottom: '20px',
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingTop: '20px',
        }}
      >
        <EuiSpacer size={'m'} />

        <FormikFieldText
          name={`${fieldPath}name`}
          fieldProps={{}}
          formRow
          rowProps={{
            ...defaultRowProps,
            style: {
              paddingLeft: 0,
            },
          }}
          inputProps={{
            ...defaultInputProps,
            value: triggerName,
            'data-test-subj': 'composite-trigger-name',
          }}
        />

        <EuiSpacer size={'l'} />

        <ExpressionQuery
          formikName={`${fieldPath}triggerConditions`}
          label={titleTemplate(
            'Trigger condition',
            'An alert will trigger when the following monitors generate active alerts.'
          )}
          selections={monitorList}
          value={this.state.expressions}
          dataTestSubj={'composite_expression_query'}
          defaultText={'Select associated monitor'}
          triggerValues={triggerValues}
        />

        <EuiSpacer size={'l'} />

        {titleTemplate('Alert severity')}
        <FormikSelect
          name={`${fieldPath}severity`}
          formRow
          fieldProps={selectFieldProps}
          rowProps={selectRowProps}
          inputProps={selectInputProps}
        />

        <EuiSpacer size={'xl'} />

        <TriggerNotifications
          httpClient={httpClient}
          plugins={plugins}
          notifications={notifications}
          notificationService={notificationService}
          triggerValues={triggerValues}
          triggerActions={triggerActions}
        />
      </ContentPanel>
    );
  }
}

DefineCompositeLevelTrigger.propTypes = propTypes;

export default DefineCompositeLevelTrigger;
