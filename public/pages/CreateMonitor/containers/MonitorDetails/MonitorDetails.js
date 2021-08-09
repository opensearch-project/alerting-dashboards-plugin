/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { EuiSpacer } from '@elastic/eui';
import ContentPanel from '../../../../components/ContentPanel';
import FormikFieldText from '../../../../components/FormControls/FormikFieldText';
import { hasError, isInvalid, required, validateMonitorName } from '../../../../utils/validate';
import Schedule from '../../components/Schedule';
import MonitorDefinitionCard from '../../components/MonitorDefinitionCards';
import MonitorType from '../../components/MonitorType';

// TODO: Make sure that resetResponse is defined in Query and passed to MonitorDetails
const MonitorDetails = ({ values, errors, httpClient, monitorToEdit, isAd, plugins }) => (
  <ContentPanel title="Monitor details" titleSize="s" bodyStyles={{ padding: 'initial' }}>
    <MonitorType values={values} />
    <EuiSpacer size="s" />
    <MonitorDefinitionCard values={values} plugins={plugins} />
    <EuiSpacer size="s" />
    <FormikFieldText
      name="name"
      formRow
      fieldProps={{ validate: validateMonitorName(httpClient, monitorToEdit) }}
      rowProps={{
        label: 'Name',
        style: { paddingLeft: '10px' },
        isInvalid,
        error: hasError,
      }}
      inputProps={{
        isInvalid,
        /* To reduce the frequency of search request,
        the comprehensive 'validationMonitorName()' is only called onBlur,
        but we enable the basic 'required()' validation onChange for good user experience.*/
        onChange: (e, field, form) => {
          field.onChange(e);
          form.setFieldError('name', required(e.target.value));
        },
      }}
    />
    <EuiSpacer size="s" />
    <Schedule isAd={isAd} />
  </ContentPanel>
);

export default MonitorDetails;
