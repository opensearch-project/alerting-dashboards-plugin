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

class DefineCompositeLevelTrigger extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const {
      edit,
      monitorValues,
      triggers,
      triggerValues,
      isDarkMode,
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
          inputProps={{ ...defaultInputProps, value: triggerName }}
        />

        <EuiSpacer size={'l'} />

        <ExpressionQuery
          formikName={`${fieldPath}triggerConditions`}
          label={titleTemplate(
            'Trigger condition',
            'An alert will trigger when the following monitors generate active alerts.'
          )}
          selections={monitorList}
          value={[]
            .concat(...monitorList.map((monitor) => [monitor, { description: 'and' }]))
            .slice(0, -1)}
          onChange={() => {}}
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
